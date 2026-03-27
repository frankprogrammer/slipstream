import Phaser from 'phaser';
import { CONFIG } from '../config';

/**
 * SlipstreamZone — Detects when the player is drafting behind a vehicle.
 *
 * Each traffic vehicle has an invisible rectangular zone behind it:
 * - Width: CONFIG.SLIPSTREAM_ZONE_WIDTH (centered on vehicle)
 * - Depth: CONFIG.SLIPSTREAM_ZONE_DEPTH (extending below vehicle)
 *
 * When the player overlaps this zone:
 * 1. Emit 'draft-start' event (first frame of overlap)
 * 2. Fill draft meter at CONFIG.DRAFT_FILL_RATE per frame
 * 3. When meter fills OR player exits zone → emit 'draft-complete'
 *
 * When player exits without filling meter → emit 'draft-cancel'
 *
 * Visual feedback (handled by GameScene listening to events):
 * - Speed lines particle emitter
 * - Amber glow on target vehicle
 * - Draft meter UI element
 * - Audio: tunneled wind + rising tone
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
    debugDraw = false
  ) {
    this.scene = scene;
    this.player = player;
    this.getTrafficVehicles = getTrafficVehicles;
    if (debugDraw) {
      this.debugGraphics = this.scene.add.graphics().setDepth(20);
    }
  }

  update(delta: number): void {
    const vehicles = this.getTrafficVehicles();
    const overlapVehicle = this.findOverlappingVehicle(vehicles);

    if (!overlapVehicle) {
      if (this.isDrafting) {
        this.isDrafting = false;
        this.draftMeter = 0;
        this.activeVehicle = null;
        this.scene.events.emit('draft-cancel');
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
      this.scene.events.emit('draft-start', overlapVehicle);
    }

    const speedScale = delta / (1000 / 60);
    this.draftMeter = Math.min(1, this.draftMeter + CONFIG.DRAFT_FILL_RATE * speedScale);
    this.scene.events.emit('draft-progress', this.draftMeter);

    if (this.draftMeter >= 1) {
      this.isDrafting = false;
      this.draftMeter = 0;
      this.lockUntilExit = true;
      this.activeVehicle = overlapVehicle;
      this.scene.events.emit('draft-complete', overlapVehicle);
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
    vehicles: readonly Phaser.GameObjects.Rectangle[]
  ): Phaser.GameObjects.Rectangle | null {
    this.player.getBounds(this.playerBounds);
    let closest: Phaser.GameObjects.Rectangle | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const vehicle of vehicles) {
      this.getZoneRect(vehicle, this.zoneRect);
      if (!Phaser.Geom.Intersects.RectangleToRectangle(this.playerBounds, this.zoneRect)) {
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

  private getZoneRect(vehicle: Phaser.GameObjects.Rectangle, out: Phaser.Geom.Rectangle): void {
    const zoneWidth = Math.min(CONFIG.SLIPSTREAM_ZONE_WIDTH, vehicle.width);
    const zoneDepth = CONFIG.SLIPSTREAM_ZONE_DEPTH;
    out.x = vehicle.x - zoneWidth / 2;
    out.y = vehicle.y + vehicle.height / 2;
    out.width = zoneWidth;
    out.height = zoneDepth;
  }

  private redrawDebug(
    vehicles: readonly Phaser.GameObjects.Rectangle[],
    overlapVehicle: Phaser.GameObjects.Rectangle | null
  ): void {
    if (!this.debugGraphics) {
      return;
    }

    this.debugGraphics.clear();
    for (const vehicle of vehicles) {
      this.getZoneRect(vehicle, this.zoneRect);
      const isActive = overlapVehicle === vehicle || this.activeVehicle === vehicle;
      this.debugGraphics.fillStyle(isActive ? CONFIG.PALETTE.AMBER : CONFIG.PALETTE.CREAM, isActive ? 0.25 : 0.15);
      this.debugGraphics.fillRect(this.zoneRect.x, this.zoneRect.y, this.zoneRect.width, this.zoneRect.height);
      this.debugGraphics.lineStyle(1, CONFIG.PALETTE.CREAM, 0.6);
      this.debugGraphics.strokeRect(this.zoneRect.x, this.zoneRect.y, this.zoneRect.width, this.zoneRect.height);
    }
  }
}
