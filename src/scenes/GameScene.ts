import Phaser from "phaser";
import { CONFIG } from "../config";
import { ChainManager } from "../engine/ChainManager";
import { CollisionSystem } from "../engine/CollisionSystem";
import { LaneSystem } from "../engine/LaneSystem";
import { ScoreManager } from "../engine/ScoreManager";
import { SlipstreamZone } from "../engine/SlipstreamZone";
import { TrafficSpawner } from "../engine/TrafficSpawner";
import { THEME } from "../skins/theme";

/**
 * GameScene — The single gameplay screen.
 *
 * Contains: 3-lane scrolling road, player vehicle, traffic vehicles,
 * slipstream detection, chain tracking, parallax background, HUD.
 *
 * See CLAUDE.md for full mechanic details.
 *
 * TODO: Implement in this order:
 * 1. Scrolling road with lane lines (placeholder rectangles)
 * 2. Player rectangle that lane-switches on swipe/arrow keys
 * 3. Traffic rectangles spawning and scrolling down
 * 4. Slipstream zone detection + draft meter
 * 5. Slingshot release + chain counter
 * 6. Score tracking + HUD
 * 7. Collision → GameOverScene transition
 * 8. Visual juice (speed lines, glow, pop tweens, sky gradient)
 * 9. Replace rectangles with sprites
 */
export class GameScene extends Phaser.Scene {
  private laneCenters: number[] = [];

  private player!: Phaser.GameObjects.Rectangle;
  private laneSystem!: LaneSystem;
  private trafficSpawner!: TrafficSpawner;
  private slipstreamZone!: SlipstreamZone;
  private chainManager!: ChainManager;
  private scoreManager!: ScoreManager;
  private collisionSystem!: CollisionSystem;

  private skyBg!: Phaser.GameObjects.Rectangle;
  private roadBg!: Phaser.GameObjects.Rectangle;
  private roadDashes: Phaser.GameObjects.Rectangle[] = [];
  private speedLines: Phaser.GameObjects.Rectangle[] = [];
  private trailCanvasTexture!: Phaser.Textures.CanvasTexture;
  private trailImage!: Phaser.GameObjects.Image;
  private playerTrailPoints: Array<{
    x: number;
    y: number;
    lifeMs: number;
    maxLifeMs: number;
  }> = [];
  private scoreText!: Phaser.GameObjects.Text;
  private draftMeterBg!: Phaser.GameObjects.Rectangle;
  private draftMeterFill!: Phaser.GameObjects.Rectangle;
  private chainText!: Phaser.GameObjects.Text;
  private perfectText!: Phaser.GameObjects.Text;
  private flashOverlay!: Phaser.GameObjects.Rectangle;

  private roadLeft = 0;
  private roadWidth = 0;
  private readonly dashLength = 36;
  private readonly dashGap = 28;
  private burstRemainingMs = 0;
  /** Cumulative speed from completed draft meters; persists after leaving the zone. */
  private persistentDraftSpeedBonus = 0;
  private isRunOver = false;
  private isDraftFxActive = false;
  private activeDraftVehicle: Phaser.GameObjects.Rectangle | null = null;
  private draftGlowTween: Phaser.Tweens.Tween | null = null;
  private speedLineSpawnAccumulatorMs = 0;
  private trailSpawnAccumulatorMs = 0;
  /** 1 = full Laplacian bend smoothing; decays after lane switch so the ribbon eases straight instead of snapping. */
  private trailCurveBlend = 0;
  private wasLaneSwitching = false;
  /** Low-pass of draft pulse for trail fill (avoids harsh per-frame color flicker). */
  private trailDraftColorPulseT = 0.5;
  private currentChain = 0;
  private currentScrollStep: number = CONFIG.BASE_SCROLL_SPEED;
  private currentWorldSpeedBonus = 0;

  constructor() {
    super({ key: "GameScene" });
  }

  preload(): void {
    // TODO: Load assets from skin manifest
    // For now, we use generated rectangles (no assets needed for prototype)
  }

  create(): void {
    this.resetRunState();

    const width = this.scale.width;
    const height = this.scale.height;

    this.roadWidth = CONFIG.LANE_COUNT * CONFIG.LANE_WIDTH;
    this.roadLeft = Math.floor((width - this.roadWidth) / 2);

    this.laneCenters = Array.from({ length: CONFIG.LANE_COUNT }, (_, lane) => {
      return this.roadLeft + (lane + 0.5) * CONFIG.LANE_WIDTH;
    });

    // Warm sunset shoulder color around the road.
    this.skyBg = this.add
      .rectangle(width / 2, height / 2, width, height, THEME.TOKENS.skyFill)
      .setDepth(-3);
    this.roadBg = this.add
      .rectangle(
        width / 2,
        height / 2,
        this.roadWidth,
        height,
        THEME.TOKENS.roadFill,
      )
      .setDepth(-2);

    this.createLaneDashes(height);
    this.createPlayer(height);
    this.createPlayerTrailCanvas();
    this.createScoreText();
    this.createDraftMeter();
    this.createChainText();
    this.createPerfectText();
    this.laneSystem = new LaneSystem(this, this.player, this.laneCenters);
    this.trafficSpawner = new TrafficSpawner(
      this,
      this.laneCenters,
      this.player.height,
    );
    this.chainManager = new ChainManager(this);
    this.scoreManager = new ScoreManager(this);
    this.slipstreamZone = new SlipstreamZone(
      this,
      this.player,
      () => this.trafficSpawner.getVehicles(),
      true,
    );
    this.collisionSystem = new CollisionSystem(
      this,
      this.player,
      () => this.trafficSpawner.getVehicles(),
      () => this.handleCollision(),
    );
    this.events.on("draft-complete", this.handleDraftComplete, this);
    this.events.on("draft-start", this.handleDraftStart, this);
    this.events.on("draft-cancel", this.handleDraftEnd, this);
    this.events.on("chain-changed", this.handleChainChanged, this);
    this.events.on("chain-milestone", this.handleChainMilestone, this);
    this.events.on("score-changed", this.handleScoreChanged, this);
    this.createFlashOverlay();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off("draft-complete", this.handleDraftComplete, this);
      this.events.off("draft-start", this.handleDraftStart, this);
      this.events.off("draft-cancel", this.handleDraftEnd, this);
      this.events.off("chain-changed", this.handleChainChanged, this);
      this.events.off("chain-milestone", this.handleChainMilestone, this);
      this.events.off("score-changed", this.handleScoreChanged, this);
      this.laneSystem.destroy();
      this.collisionSystem.destroy();
      this.slipstreamZone.destroy();
      this.trafficSpawner.destroy();
      this.clearDraftEffects();
      this.clearPlayerTrail();
    });
  }

  update(time: number, delta: number): void {
    void time;

    this.laneSystem.update();
    this.scrollRoad(delta);
    const speedScale = delta / (1000 / 60);
    const baseScrollThisFrame = CONFIG.BASE_SCROLL_SPEED * speedScale;
    const draftWorldScrollRatio =
      baseScrollThisFrame > 0
        ? this.currentScrollStep / baseScrollThisFrame
        : 1;
    this.trafficSpawner.update(delta, this.currentWorldSpeedBonus);
    this.slipstreamZone.update(delta, draftWorldScrollRatio);
    this.collisionSystem.update();
    this.chainManager.update(delta, this.slipstreamZone.isCurrentlyDrafting());
    this.updateSpeedLines(delta);
    this.updatePlayerTrail(delta);
    this.updateSkyGradient();
    this.updateDraftMeterUI();
  }

  private createLaneDashes(height: number): void {
    for (let separator = 1; separator < CONFIG.LANE_COUNT; separator += 1) {
      const x = this.roadLeft + separator * CONFIG.LANE_WIDTH;
      for (
        let y = -this.dashLength;
        y <= height + this.dashLength;
        y += this.dashLength + this.dashGap
      ) {
        const dash = this.add
          .rectangle(x, y, 6, this.dashLength, THEME.TOKENS.laneDivider)
          .setDepth(-1);
        this.roadDashes.push(dash);
      }
    }
  }

  private createPlayer(height: number): void {
    const playerY = height * CONFIG.PLAYER_Y_POSITION;
    const startLane = Math.floor(CONFIG.LANE_COUNT / 2);
    this.player = this.add
      .rectangle(
        this.laneCenters[startLane],
        playerY,
        CONFIG.LANE_WIDTH * 0.45,
        72,
        THEME.TOKENS.playerBody,
      )
      .setDepth(10)
      .setStrokeStyle(3, THEME.TOKENS.playerOutline);
  }

  private createPlayerTrailCanvas(): void {
    const w = Math.ceil(this.scale.width);
    const h = Math.ceil(this.scale.height);
    if (this.textures.exists("playerTrailCanvas")) {
      this.textures.remove("playerTrailCanvas");
    }
    const trailTex = this.textures.createCanvas("playerTrailCanvas", w, h);
    if (!trailTex) {
      throw new Error("Failed to create playerTrailCanvas texture");
    }
    this.trailCanvasTexture = trailTex;
    const trailTexKey = this.textures.get("playerTrailCanvas");
    if (trailTexKey?.setFilter) {
      trailTexKey.setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    this.trailImage = this.add
      .image(0, 0, "playerTrailCanvas")
      .setOrigin(0, 0)
      .setDepth(9);
    (this.trailImage as unknown as { roundPixels?: boolean }).roundPixels = true;
  }

  private createDraftMeter(): void {
    const meterWidth = 56;
    const meterHeight = 8;

    this.draftMeterBg = this.add
      .rectangle(
        this.player.x,
        this.player.y - 62,
        meterWidth,
        meterHeight,
        THEME.TOKENS.draftMeterBg,
      )
      .setDepth(11)
      .setVisible(false);

    this.draftMeterFill = this.add
      .rectangle(
        this.player.x - meterWidth / 2,
        this.player.y - 62,
        0,
        meterHeight - 2,
        THEME.TOKENS.draftMeterFill,
      )
      .setOrigin(0, 0.5)
      .setDepth(12)
      .setVisible(false);
  }

  private createScoreText(): void {
    this.scoreText = this.add
      .text(this.scale.width / 2, 16, "0", {
        fontFamily: "Arial",
        fontSize: "40px",
        color: THEME.TOKENS.hudTextHex,
      })
      .setOrigin(0.5, 0)
      .setDepth(15)
      .setShadow(0, 2, THEME.TOKENS.hudShadowHex, 4, false, true);
  }

  private createChainText(): void {
    this.chainText = this.add
      .text(this.scale.width / 2, 86, "x0", {
        fontFamily: "Arial",
        fontSize: "30px",
        color: THEME.TOKENS.hudTextHex,
      })
      .setOrigin(0.5, 0)
      .setDepth(15)
      .setShadow(0, 2, THEME.TOKENS.hudShadowHex, 4, false, true);
  }

  private createFlashOverlay(): void {
    this.flashOverlay = this.add
      .rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        THEME.TOKENS.milestoneFlash,
      )
      .setDepth(40)
      .setAlpha(0)
      .setVisible(false);
  }

  private createPerfectText(): void {
    this.perfectText = this.add
      .text(this.scale.width / 2, this.scale.height * 0.36, "PERFECT!", {
        fontFamily: "Arial",
        fontSize: "58px",
        color: THEME.TOKENS.hudTextHex,
      })
      .setOrigin(0.5)
      .setDepth(41)
      .setAlpha(0)
      .setScale(0.8)
      .setVisible(false)
      .setShadow(0, 2, THEME.TOKENS.hudShadowHex, 4, false, true);
  }

  private updateDraftMeterUI(): void {
    const meterWidth = this.draftMeterBg.width;
    const meterY = this.player.y - 62;
    const meterVisible = this.slipstreamZone.isCurrentlyDrafting();
    const fillRatio = this.slipstreamZone.getDraftMeter();

    this.draftMeterBg
      .setPosition(this.player.x, meterY)
      .setVisible(meterVisible);

    this.draftMeterFill
      .setPosition(this.player.x - meterWidth / 2, meterY)
      .setSize(meterWidth * fillRatio, this.draftMeterFill.height)
      .setVisible(meterVisible);
  }

  private scrollRoad(delta: number): void {
    const speedScale = delta / (1000 / 60);
    this.burstRemainingMs = Math.max(0, this.burstRemainingMs - delta);
    const draftSpeed = this.persistentDraftSpeedBonus;
    const burstSpeed =
      this.burstRemainingMs > 0 ? CONFIG.SLINGSHOT_SPEED_BURST : 0;
    this.currentWorldSpeedBonus = draftSpeed + burstSpeed;
    const scrollStep =
      (CONFIG.BASE_SCROLL_SPEED + draftSpeed + burstSpeed) * speedScale;
    this.currentScrollStep = scrollStep;
    this.scoreManager.addDistance(scrollStep);
    const wrapY = this.scale.height + this.dashLength;

    for (const dash of this.roadDashes) {
      dash.y += scrollStep;
      if (dash.y > wrapY) {
        dash.y = -this.dashLength;
      }
    }
  }

  private handleDraftComplete(): void {
    const chain = this.chainManager.completeDraft();
    this.scoreManager.addDraftCompleteBonus(chain);
    this.burstRemainingMs = CONFIG.SLINGSHOT_BURST_DURATION;
    this.persistentDraftSpeedBonus = Math.min(
      this.persistentDraftSpeedBonus + CONFIG.DRAFT_SPEED_BONUS,
      CONFIG.DRAFT_SPEED_BONUS_MAX,
    );
    this.handleDraftEnd();

    this.tweens.add({
      targets: this.player,
      scaleX: 1.15,
      scaleY: 0.9,
      duration: 70,
      yoyo: true,
      ease: "Sine.Out",
    });
  }

  private handleChainChanged(chain: number): void {
    this.currentChain = chain;
    this.chainText.setText(`x${chain}`);
    this.chainText.setScale(CONFIG.CHAIN_POP_SCALE);
    this.tweens.add({
      targets: this.chainText,
      scale: 1,
      duration: CONFIG.CHAIN_POP_DURATION,
      ease: "Back.easeOut",
    });
  }

  private handleScoreChanged(score: number): void {
    this.scoreText.setText(`${Math.floor(score)}`);
  }

  private handleDraftStart(vehicle: Phaser.GameObjects.Rectangle): void {
    this.clearDraftEffects();
    this.isDraftFxActive = true;
    this.activeDraftVehicle = vehicle;
    vehicle.setStrokeStyle(4, THEME.TOKENS.draftGlow);
    const glowPulseMs = Phaser.Math.Clamp(
      CONFIG.DRAFT_GLOW_PULSE_SPEED -
        chainIntensityFor(this.currentChain) * 350,
      260,
      CONFIG.DRAFT_GLOW_PULSE_SPEED,
    );
    this.draftGlowTween = this.tweens.add({
      targets: vehicle,
      alpha: 0.7,
      duration: glowPulseMs / 2,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });
  }

  private handleDraftEnd(): void {
    this.clearDraftEffects();
  }

  private clearDraftEffects(): void {
    this.isDraftFxActive = false;
    this.speedLineSpawnAccumulatorMs = 0;

    for (const line of this.speedLines) {
      line.destroy();
    }
    this.speedLines = [];

    this.draftGlowTween?.stop();
    this.draftGlowTween = null;
    if (this.activeDraftVehicle?.active) {
      this.activeDraftVehicle.setAlpha(1);
      this.activeDraftVehicle.setStrokeStyle(2, THEME.TOKENS.trafficOutline);
    }
    this.activeDraftVehicle = null;
  }

  private updateSpeedLines(delta: number): void {
    const speedScale = delta / (1000 / 60);
    const intensity = chainIntensityFor(this.currentChain);
    const speedLineVelocity = (12 + intensity * 7) * speedScale;

    for (let i = this.speedLines.length - 1; i >= 0; i -= 1) {
      const line = this.speedLines[i];
      line.setFillStyle(this.getSpeedLineFillColor());
      line.y += speedLineVelocity;
      line.alpha = Math.max(0, line.alpha - 0.025 * speedScale);
      if (
        line.y - line.height / 2 > this.scale.height + 24 ||
        line.alpha <= 0
      ) {
        line.destroy();
        this.speedLines.splice(i, 1);
      }
    }

    if (!this.isDraftFxActive) {
      return;
    }

    this.speedLineSpawnAccumulatorMs += delta;
    const targetFrequency = Phaser.Math.Clamp(
      CONFIG.SPEED_LINES_FREQUENCY - intensity * 28,
      20,
      CONFIG.SPEED_LINES_FREQUENCY,
    );
    while (this.speedLineSpawnAccumulatorMs >= targetFrequency) {
      this.speedLineSpawnAccumulatorMs -= targetFrequency;
      this.spawnSpeedLine();
    }
  }

  private spawnSpeedLine(): void {
    const intensity = chainIntensityFor(this.currentChain);
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft
      ? Phaser.Math.Between(6, Math.max(8, this.roadLeft - 4))
      : Phaser.Math.Between(
          Math.min(this.scale.width - 8, this.roadLeft + this.roadWidth + 4),
          this.scale.width - 6,
        );
    const y = Phaser.Math.Between(0, this.scale.height - 120);
    const line = this.add
      .rectangle(
        x,
        y,
        Phaser.Math.Between(
          CONFIG.SPEED_LINES_WIDTH_MIN,
          CONFIG.SPEED_LINES_WIDTH_MAX,
        ),
        Phaser.Math.Between(
          CONFIG.SPEED_LINES_HEIGHT_MIN,
          CONFIG.SPEED_LINES_HEIGHT_MAX,
        ),
        this.getSpeedLineFillColor(),
      )
      .setDepth(14)
      .setAlpha(
        Phaser.Math.Clamp(
          CONFIG.SPEED_LINES_BASE_ALPHA + intensity * 0.35,
          CONFIG.SPEED_LINES_BASE_ALPHA,
          CONFIG.SPEED_LINES_MAX_ALPHA,
        ),
      );
    this.speedLines.push(line);
  }

  private updatePlayerTrail(delta: number): void {
    const speedFactor = Phaser.Math.Clamp(
      this.currentScrollStep / CONFIG.BASE_SCROLL_SPEED,
      1,
      2.6,
    );
    const moveScale = delta / (1000 / 60);

    for (let i = this.playerTrailPoints.length - 1; i >= 0; i -= 1) {
      const point = this.playerTrailPoints[i];
      point.lifeMs -= delta;

      if (point.lifeMs <= 0) {
        this.playerTrailPoints.splice(i, 1);
        continue;
      }

      point.y += this.currentScrollStep * 1.1 * moveScale;
    }

    this.trailSpawnAccumulatorMs += delta;
    const spawnIntervalMs = Phaser.Math.Clamp(
      48 / speedFactor,
      CONFIG.TRAIL_SPAWN_INTERVAL_MIN_MS,
      48,
    );
    while (this.trailSpawnAccumulatorMs >= spawnIntervalMs) {
      this.trailSpawnAccumulatorMs -= spawnIntervalMs;
      this.spawnPlayerTrailPoint(speedFactor);
    }

    this.renderPlayerTrail(delta, speedFactor);
  }

  private spawnPlayerTrailPoint(speedFactor: number): void {
    this.playerTrailPoints.unshift({
      x: this.player.x,
      y: this.player.y + this.player.height * 0.46,
      lifeMs: 328.125 + 140.625 / speedFactor,
      maxLifeMs: 328.125 + 140.625 / speedFactor,
    });

    if (this.playerTrailPoints.length > 32) {
      this.playerTrailPoints.length = 32;
    }
  }

  private renderPlayerTrail(delta: number, speedFactor: number): void {
    const ctx = this.trailCanvasTexture.context;
    const canvas = this.trailCanvasTexture.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.playerTrailPoints.length < 2) {
      this.trailCanvasTexture.refresh();
      return;
    }

    const smoothed = this.buildSmoothedTrailPoints(this.playerTrailPoints);
    if (smoothed.length < 2) {
      this.trailCanvasTexture.refresh();
      return;
    }

    const dense = this.densifyPolyline(
      smoothed,
      CONFIG.TRAIL_DENSIFY_MAX_SEGMENT_PX,
    );
    const ribbon = this.blendDenseWithLaplacianSmooth(
      dense,
      this.trailCurveBlend,
    );
    const n = ribbon.length;
    const headWidth = this.player.width * 0.75;
    const tailWidth = this.player.width * 0.25;
    const rawAlpha = Phaser.Math.Clamp(
      0.7 + (speedFactor - 1) * 0.2,
      0.7,
      1,
    );
    const overallAlpha = Math.round(rawAlpha * 500) / 500;
    const colorInt = this.getPlayerTrailFillColor(delta);
    const rgb = Phaser.Display.Color.IntegerToColor(colorInt);
    const r = Math.round(rgb.red);
    const g = Math.round(rgb.green);
    const b = Math.round(rgb.blue);
    const tailA = Math.round(overallAlpha * 0.04 * 1000) / 1000;

    ctx.save();
    // One continuous stroke so round joins close corners (segment+butt strokes leave wedge gaps — “open book”).
    // Canvas 2D can’t vary line width along one path; approximate taper with alpha gradient + width between head/tail.
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(2, Phaser.Math.Linear(headWidth, tailWidth, 0.42));

    const hx = this.snapTrailCanvasCoord(ribbon[0].x);
    const hy = this.snapTrailCanvasCoord(ribbon[0].y);
    const tx = this.snapTrailCanvasCoord(ribbon[n - 1].x);
    const ty = this.snapTrailCanvasCoord(ribbon[n - 1].y);
    const grad = ctx.createLinearGradient(hx, hy, tx, ty);
    grad.addColorStop(0, `rgba(${r},${g},${b},${overallAlpha})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},${tailA})`);
    ctx.strokeStyle = grad;

    ctx.beginPath();
    ctx.moveTo(hx, hy);
    for (let i = 1; i < n; i += 1) {
      ctx.lineTo(
        this.snapTrailCanvasCoord(ribbon[i].x),
        this.snapTrailCanvasCoord(ribbon[i].y),
      );
    }
    ctx.stroke();
    ctx.restore();

    this.trailCanvasTexture.refresh();
  }

  /** While actively drafting, pulse trail color between base blue and teal (smoothed vs vehicle glow to limit ribbon flicker). */
  private getPlayerTrailFillColor(delta: number): number {
    if (!this.slipstreamZone.isCurrentlyDrafting()) {
      this.trailDraftColorPulseT = 0.5;
      return THEME.TOKENS.playerTrail;
    }

    const glowPulseMs = Phaser.Math.Clamp(
      CONFIG.DRAFT_GLOW_PULSE_SPEED -
        chainIntensityFor(this.currentChain) * 350,
      260,
      CONFIG.DRAFT_GLOW_PULSE_SPEED,
    );
    // Narrower lerp range + heavier smoothing reduces per-frame RGB drift on mobile GPUs.
    const targetT =
      0.5 +
      0.32 * Math.sin((this.time.now / glowPulseMs) * Math.PI * 2);
    const smooth = 1 - Math.exp(-delta * 0.0032);
    this.trailDraftColorPulseT = Phaser.Math.Linear(
      this.trailDraftColorPulseT,
      targetT,
      smooth,
    );
    const t = this.trailDraftColorPulseT;
    const c0 = Phaser.Display.Color.IntegerToColor(THEME.TOKENS.playerTrail);
    const c1 = Phaser.Display.Color.IntegerToColor(
      THEME.TOKENS.playerTrailDraftPulseTeal,
    );
    return Phaser.Display.Color.GetColor(
      Phaser.Math.Linear(c0.red, c1.red, t),
      Phaser.Math.Linear(c0.green, c1.green, t),
      Phaser.Math.Linear(c0.blue, c1.blue, t),
    );
  }

  /** Half-pixel grid for canvas strokes — cuts subpixel shimmer on mobile GPUs. */
  private snapTrailCanvasCoord(v: number): number {
    return Math.round(v * 2) / 2;
  }

  /** Insert points along long edges so ribbon tangents don’t jump (lane-change diagonals). */
  private densifyPolyline(
    points: Phaser.Math.Vector2[],
    maxSegLen: number,
  ): Phaser.Math.Vector2[] {
    if (points.length < 2) {
      return points;
    }
    const out: Phaser.Math.Vector2[] = [];
    out.push(points[0].clone());
    for (let i = 0; i < points.length - 1; i += 1) {
      const a = points[i];
      const b = points[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.ceil(dist / maxSegLen));
      for (let s = 1; s <= steps; s += 1) {
        const t = s / steps;
        out.push(
          new Phaser.Math.Vector2(
            Phaser.Math.Linear(a.x, b.x, t),
            Phaser.Math.Linear(a.y, b.y, t),
          ),
        );
      }
    }
    return out;
  }

  /** Blend densified polyline (straighter in-lane) with Laplacian-smoothed (full bend). */
  private blendDenseWithLaplacianSmooth(
    dense: Phaser.Math.Vector2[],
    blend: number,
  ): Phaser.Math.Vector2[] {
    if (blend <= 0) {
      return dense;
    }
    const smooth = this.smoothRibbonLaplacian(
      dense.map((p) => p.clone()),
      CONFIG.TRAIL_LAPLACIAN_SMOOTH_PASSES,
    );
    if (blend >= 1) {
      return smooth;
    }
    return dense.map((p, i) => {
      const s = smooth[i];
      return new Phaser.Math.Vector2(
        Phaser.Math.Linear(p.x, s.x, blend),
        Phaser.Math.Linear(p.y, s.y, blend),
      );
    });
  }

  /** Light smoothing of the centerline to soften lane-change corners (no sharp kinks). */
  private smoothRibbonLaplacian(
    points: Phaser.Math.Vector2[],
    passes: number,
  ): Phaser.Math.Vector2[] {
    if (passes < 1 || points.length < 3) {
      return points;
    }
    let cur = points.map((p) => p.clone());
    for (let p = 0; p < passes; p += 1) {
      const next = cur.map((v) => v.clone());
      for (let i = 1; i < cur.length - 1; i += 1) {
        next[i].x = 0.25 * cur[i - 1].x + 0.5 * cur[i].x + 0.25 * cur[i + 1].x;
        next[i].y = 0.25 * cur[i - 1].y + 0.5 * cur[i].y + 0.25 * cur[i + 1].y;
      }
      cur = next;
    }
    return cur;
  }

  private buildSmoothedTrailPoints(
    points: Array<{ x: number; y: number; lifeMs: number; maxLifeMs: number }>,
  ): Phaser.Math.Vector2[] {
    let smoothed = points.map((p) => new Phaser.Math.Vector2(p.x, p.y));
    if (smoothed.length < 3) {
      return smoothed;
    }

    // Chaikin smoothing keeps the curve smooth without Catmull overshoot/self-intersections.
    const iterations = CONFIG.TRAIL_CHAIKIN_ITERATIONS;
    for (let iter = 0; iter < iterations; iter += 1) {
      const next: Phaser.Math.Vector2[] = [smoothed[0].clone()];
      for (let i = 0; i < smoothed.length - 1; i += 1) {
        const p0 = smoothed[i];
        const p1 = smoothed[i + 1];
        const q = new Phaser.Math.Vector2(
          0.75 * p0.x + 0.25 * p1.x,
          0.75 * p0.y + 0.25 * p1.y,
        );
        const r = new Phaser.Math.Vector2(
          0.25 * p0.x + 0.75 * p1.x,
          0.25 * p0.y + 0.75 * p1.y,
        );
        next.push(q, r);
      }
      next.push(smoothed[smoothed.length - 1].clone());
      smoothed = next;
    }

    return smoothed;
  }

  private handleChainMilestone(milestone: number): void {
    if (milestone !== 10) {
      return;
    }

    this.tweens.killTweensOf(this.flashOverlay);
    this.flashOverlay.setVisible(true).setAlpha(0.45);
    this.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration: CONFIG.SCREEN_FLASH_DURATION,
      ease: "Quad.Out",
      onComplete: () => {
        this.flashOverlay.setVisible(false);
      },
    });

    this.tweens.killTweensOf(this.perfectText);
    this.perfectText
      .setVisible(true)
      .setAlpha(1)
      .setScale(0.84)
      .setY(this.scale.height * 0.38);
    this.tweens.add({
      targets: this.perfectText,
      y: this.scale.height * 0.33,
      scale: 1,
      alpha: 0,
      duration: 1000,
      ease: "Cubic.Out",
      onComplete: () => {
        this.perfectText.setVisible(false);
      },
    });
  }

  /** Same lerp as the sky rectangle; used for speed-line inverse color. */
  private getSkyGradientFillColor(): number {
    const distance = this.scoreManager.getDistancePx();
    const segmentLength = CONFIG.SKY_TRANSITION_DISTANCE;
    const colorCount = THEME.SKY_GRADIENT.length;

    if (colorCount < 2) {
      return THEME.TOKENS.skyFill;
    }

    const phase = distance / segmentLength;
    const wrappedPhase = ((phase % colorCount) + colorCount) % colorCount;
    const fromIndex = Math.floor(wrappedPhase);
    const toIndex = (fromIndex + 1) % colorCount;
    const t = wrappedPhase - fromIndex;

    const from = Phaser.Display.Color.HexStringToColor(
      THEME.SKY_GRADIENT[fromIndex],
    );
    const to = Phaser.Display.Color.HexStringToColor(
      THEME.SKY_GRADIENT[toIndex],
    );
    const lerped = Phaser.Display.Color.Interpolate.ColorWithColor(
      from,
      to,
      1,
      t,
    );
    return Phaser.Display.Color.GetColor(lerped.r, lerped.g, lerped.b);
  }

  /** Perceptual complement to the active sky: RGB inverse so streaks stay readable on any sunset phase. */
  private getSpeedLineFillColor(): number {
    const sky = this.getSkyGradientFillColor();
    const c = Phaser.Display.Color.IntegerToColor(sky);
    return Phaser.Display.Color.GetColor(
      255 - c.red,
      255 - c.green,
      255 - c.blue,
    );
  }

  private updateSkyGradient(): void {
    this.skyBg.setFillStyle(this.getSkyGradientFillColor(), 1);
  }

  private handleCollision(): void {
    if (this.isRunOver) {
      return;
    }

    this.isRunOver = true;
    this.chainManager.resetChain("collision");
    this.scene.start("GameOverScene", {
      score: Math.floor(this.scoreManager.getScore()),
      bestChain: this.chainManager.getBestChain(),
      distance: Math.floor(this.scoreManager.getDistancePx()),
    });
  }

  private resetRunState(): void {
    this.isRunOver = false;
    this.burstRemainingMs = 0;
    this.persistentDraftSpeedBonus = 0;
    this.isDraftFxActive = false;
    this.activeDraftVehicle = null;
    this.speedLineSpawnAccumulatorMs = 0;
    this.trailSpawnAccumulatorMs = 0;
    this.trailCurveBlend = 0;
    this.wasLaneSwitching = false;
    this.trailDraftColorPulseT = 0.5;
    this.currentChain = 0;
    this.currentScrollStep = CONFIG.BASE_SCROLL_SPEED;
    this.currentWorldSpeedBonus = 0;
  }

  private clearPlayerTrail(): void {
    this.playerTrailPoints = [];
    if (this.trailCanvasTexture) {
      const ctx = this.trailCanvasTexture.context;
      const canvas = this.trailCanvasTexture.canvas;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.trailCanvasTexture.refresh();
    }
  }
}

function chainIntensityFor(chain: number): number {
  return Phaser.Math.Clamp(chain / 12, 0, 1);
}
