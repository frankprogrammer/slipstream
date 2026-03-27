import Phaser from "phaser";
import { CONFIG } from "../config";
import { THEME } from "../skins/theme";

/**
 * SlipstreamZone — Detects when the player is drafting behind a vehicle.
 *
 * Each traffic vehicle has an invisible rectangular zone behind it:
 * - Width: CONFIG.SLIPSTREAM_ZONE_WIDTH (centered on vehicle)
 * - Depth: CONFIG.SLIPSTREAM_ZONE_DEPTH (extending below vehicle)
 *
 * When the player overlaps this zone:
 * 1. Emit 'draft-start' event (first frame of overlap)
 * 2. Fill draft meter at CONFIG.DRAFT_FILL_RATE × (scroll ratio clamped to DRAFT_FILL_SPEED_RATIO_MAX) per frame
 * 3. When meter fills → emit 'draft-complete'
 *
 * When player exits without filling meter → emit 'draft-cancel'
 *
 * Visual feedback (handled by GameScene listening to events):
 * - Speed lines particle emitter
 * - Amber glow on target vehicle
 * - Draft meter UI element
 * - Audio: tunneled wind + rising tone
 *
 * When debugDraw is on: slipstream areas show vertical streaks (same width range as edge speed lines)
 * in a repeating stripe+gap rhythm per column, scrolling downward and looping — no outer border stroke.
 */
export class SlipstreamZone {
  private readonly scene: Phaser.Scene;
  private readonly player: Phaser.GameObjects.Rectangle;
  private readonly getTrafficVehicles: () => readonly Phaser.GameObjects.Rectangle[];
  private readonly debugGraphics?: Phaser.GameObjects.Graphics;

  private readonly playerBounds = new Phaser.Geom.Rectangle();
  private readonly zoneRect = new Phaser.Geom.Rectangle();

  private isDrafting = false;
  private draftMeter = 0;
  private lockUntilExit = false;
  private activeVehicle: Phaser.GameObjects.Rectangle | null = null;

  constructor(
    scene: Phaser.Scene,
    player: Phaser.GameObjects.Rectangle,
    getTrafficVehicles: () => readonly Phaser.GameObjects.Rectangle[],
    debugDraw = false,
  ) {
    this.scene = scene;
    this.player = player;
    this.getTrafficVehicles = getTrafficVehicles;
    if (debugDraw) {
      // Below trail (9) and player (10) so the car stays fully opaque on top.
      this.debugGraphics = this.scene.add.graphics().setDepth(8);
    }
  }

  /**
   * @param worldScrollSpeedRatio — current scroll step ÷ (BASE_SCROLL_SPEED × frame scale); keeps draft fill pace with world speed
   */
  update(delta: number, worldScrollSpeedRatio: number = 1): void {
    const vehicles = this.getTrafficVehicles();
    const overlapVehicle = this.findOverlappingVehicle(vehicles);

    if (!overlapVehicle) {
      if (this.isDrafting) {
        this.isDrafting = false;
        this.draftMeter = 0;
        this.activeVehicle = null;
        this.scene.events.emit("draft-cancel");
      }
      this.lockUntilExit = false;
      this.redrawDebug(vehicles, null);
      return;
    }

    if (this.lockUntilExit) {
      this.redrawDebug(vehicles, overlapVehicle);
      return;
    }

    if (!this.isDrafting) {
      this.isDrafting = true;
      this.draftMeter = 0;
      this.activeVehicle = overlapVehicle;
      this.scene.events.emit("draft-start", overlapVehicle);
    }

    const speedScale = delta / (1000 / 60);
    const fill =
      CONFIG.DRAFT_FILL_RATE *
      speedScale *
      Phaser.Math.Clamp(
        worldScrollSpeedRatio,
        0.15,
        CONFIG.DRAFT_FILL_SPEED_RATIO_MAX,
      );
    this.draftMeter = Math.min(1, this.draftMeter + fill);
    this.scene.events.emit("draft-progress", this.draftMeter);

    if (this.draftMeter >= 1) {
      this.isDrafting = false;
      this.draftMeter = 0;
      this.lockUntilExit = true;
      this.activeVehicle = overlapVehicle;
      this.scene.events.emit("draft-complete", overlapVehicle);
    }

    this.redrawDebug(vehicles, overlapVehicle);
  }

  destroy(): void {
    this.debugGraphics?.destroy();
  }

  isCurrentlyDrafting(): boolean {
    return this.isDrafting;
  }

  getDraftMeter(): number {
    return this.draftMeter;
  }

  private findOverlappingVehicle(
    vehicles: readonly Phaser.GameObjects.Rectangle[],
  ): Phaser.GameObjects.Rectangle | null {
    this.player.getBounds(this.playerBounds);
    let closest: Phaser.GameObjects.Rectangle | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const vehicle of vehicles) {
      this.getZoneRect(vehicle, this.zoneRect);
      if (
        !Phaser.Geom.Intersects.RectangleToRectangle(
          this.playerBounds,
          this.zoneRect,
        )
      ) {
        continue;
      }

      const distance = Math.abs(vehicle.y - this.player.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = vehicle;
      }
    }

    return closest;
  }

  private getZoneRect(
    vehicle: Phaser.GameObjects.Rectangle,
    out: Phaser.Geom.Rectangle,
  ): void {
    const zoneWidth = Math.min(CONFIG.SLIPSTREAM_ZONE_WIDTH, vehicle.width);
    const zoneDepth = CONFIG.SLIPSTREAM_ZONE_DEPTH;
    out.x = vehicle.x - zoneWidth / 2;
    out.y = vehicle.y + vehicle.height / 2;
    out.width = zoneWidth;
    out.height = zoneDepth;
  }

  private redrawDebug(
    vehicles: readonly Phaser.GameObjects.Rectangle[],
    overlapVehicle: Phaser.GameObjects.Rectangle | null,
  ): void {
    if (!this.debugGraphics) {
      return;
    }

    this.debugGraphics.clear();
    for (const vehicle of vehicles) {
      this.getZoneRect(vehicle, this.zoneRect);
      const isActive =
        overlapVehicle === vehicle || this.activeVehicle === vehicle;
      const fillColor = isActive
        ? THEME.TOKENS.debugZoneActive
        : THEME.TOKENS.debugZoneIdle;
      // Per-streak alpha (many streaks stack visually; same active/idle contrast as before).
      const streakAlpha = isActive
        ? CONFIG.SLIPSTREAM_DEBUG_STREAK_ALPHA_ACTIVE
        : CONFIG.SLIPSTREAM_DEBUG_STREAK_ALPHA_IDLE;
      this.drawSpeedLineStyleStripesInZone(this.zoneRect, fillColor, streakAlpha);
    }
  }

  /**
   * Vertical streaks (edge speed line width) scrolling downward, clipped to `zone`.
   * Each column tiles a fixed segment list (variable brick heights); world offset scrolls top → bottom.
   */
  private drawSpeedLineStyleStripesInZone(
    zone: Phaser.Geom.Rectangle,
    fillColor: number,
    streakAlpha: number,
  ): void {
    const g = this.debugGraphics!;
    const wMin = CONFIG.SPEED_LINES_WIDTH_MIN;
    const wMax = CONFIG.SPEED_LINES_WIDTH_MAX;
    const columnStep = 9;
    const presets = CONFIG.SLIPSTREAM_DEBUG_STREAK_COLUMN_PRESETS;
    const zoneLeft = Math.round(zone.x);
    const zoneRight = Math.round(zone.x + zone.width);
    const zoneTop = Math.round(zone.y);
    const zoneBottom = Math.round(zone.y + zone.height);
    const zoneH = zoneBottom - zoneTop;

    const scrollInt = Math.floor(
      (this.scene.time.now / 1000) * CONFIG.SLIPSTREAM_DEBUG_STREAK_SCROLL_SPEED,
    );

    let col = 0;
    for (let px = zoneLeft + 1; px + wMin < zoneRight - 1; px += columnStep) {
      const pxI = Math.round(px);
      const rw =
        wMin +
        ((col * 3 + Math.floor(zone.x * 0.1) + Math.floor(zone.y)) %
          (wMax - wMin + 1));

      const preset = presets[col % presets.length]!;
      const norm = preset.segments.map((s) => ({
        brick: Math.max(1, Math.round(s.brick)),
        gap: Math.max(0, Math.round(s.gap)),
      }));
      let period = 0;
      for (const n of norm) {
        period += n.brick + n.gap;
      }
      period = Math.max(1, period);

      const phase =
        ((col * 17 + Math.floor(zone.x) * 3) % period + period) % period;
      const scrollOffset = scrollInt + phase;

      const pad = period * 4;
      const rMin = Math.floor((scrollOffset - pad) / period) - 2;
      const rMax = Math.ceil((scrollOffset + zoneH + pad) / period) + 2;

      for (let r = rMin; r <= rMax; r += 1) {
        let acc = 0;
        for (const seg of norm) {
          const w0 = r * period + acc;
          const dTop = scrollOffset - w0;
          const yTop = zoneTop + dTop;
          const yBot = yTop + seg.brick;
          const drawTop = Math.max(zoneTop, Math.round(yTop));
          const drawBottom = Math.min(zoneBottom, Math.round(yBot));
          if (drawBottom > drawTop) {
            g.fillStyle(fillColor, streakAlpha);
            g.fillRect(pxI, drawTop, rw, drawBottom - drawTop);
          }
          acc += seg.brick + seg.gap;
        }
      }
      col += 1;
    }
  }
}
