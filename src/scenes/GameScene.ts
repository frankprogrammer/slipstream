import Phaser from 'phaser';
import { CONFIG } from '../config';
import { ChainManager } from '../engine/ChainManager';
import { CollisionSystem } from '../engine/CollisionSystem';
import { LaneSystem } from '../engine/LaneSystem';
import { ScoreManager } from '../engine/ScoreManager';
import { SlipstreamZone } from '../engine/SlipstreamZone';
import { TrafficSpawner } from '../engine/TrafficSpawner';
import { THEME } from '../skins/theme';

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
  private playerTrailGraphics!: Phaser.GameObjects.Graphics;
  private playerTrailPoints: Array<{ x: number; y: number; lifeMs: number; maxLifeMs: number }> = [];
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
  private isRunOver = false;
  private isDraftFxActive = false;
  private activeDraftVehicle: Phaser.GameObjects.Rectangle | null = null;
  private draftGlowTween: Phaser.Tweens.Tween | null = null;
  private speedLineSpawnAccumulatorMs = 0;
  private trailSpawnAccumulatorMs = 0;
  private currentChain = 0;
  private currentScrollStep: number = CONFIG.BASE_SCROLL_SPEED;
  private previousPlayerX = 0;

  constructor() {
    super({ key: 'GameScene' });
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
    this.skyBg = this.add.rectangle(width / 2, height / 2, width, height, THEME.TOKENS.skyFill).setDepth(-3);
    this.roadBg = this.add
      .rectangle(width / 2, height / 2, this.roadWidth, height, THEME.TOKENS.roadFill)
      .setDepth(-2);

    this.createLaneDashes(height);
    this.createPlayer(height);
    this.previousPlayerX = this.player.x;
    this.createPlayerTrailGraphics();
    this.createScoreText();
    this.createDraftMeter();
    this.createChainText();
    this.createPerfectText();
    this.laneSystem = new LaneSystem(this, this.player, this.laneCenters);
    this.trafficSpawner = new TrafficSpawner(this, this.laneCenters, this.player.height);
    this.chainManager = new ChainManager(this);
    this.scoreManager = new ScoreManager(this);
    this.slipstreamZone = new SlipstreamZone(
      this,
      this.player,
      () => this.trafficSpawner.getVehicles(),
      true
    );
    this.collisionSystem = new CollisionSystem(
      this,
      this.player,
      () => this.trafficSpawner.getVehicles(),
      () => this.handleCollision()
    );
    this.events.on('draft-complete', this.handleDraftComplete, this);
    this.events.on('draft-start', this.handleDraftStart, this);
    this.events.on('draft-cancel', this.handleDraftEnd, this);
    this.events.on('chain-changed', this.handleChainChanged, this);
    this.events.on('chain-milestone', this.handleChainMilestone, this);
    this.events.on('score-changed', this.handleScoreChanged, this);
    this.createFlashOverlay();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('draft-complete', this.handleDraftComplete, this);
      this.events.off('draft-start', this.handleDraftStart, this);
      this.events.off('draft-cancel', this.handleDraftEnd, this);
      this.events.off('chain-changed', this.handleChainChanged, this);
      this.events.off('chain-milestone', this.handleChainMilestone, this);
      this.events.off('score-changed', this.handleScoreChanged, this);
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
    this.trafficSpawner.update(delta);
    this.slipstreamZone.update(delta);
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
      for (let y = -this.dashLength; y <= height + this.dashLength; y += this.dashLength + this.dashGap) {
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
        THEME.TOKENS.playerBody
      )
      .setDepth(10)
      .setStrokeStyle(3, THEME.TOKENS.playerOutline);
  }

  private createPlayerTrailGraphics(): void {
    this.playerTrailGraphics = this.add.graphics().setDepth(9);
  }

  private createDraftMeter(): void {
    const meterWidth = 56;
    const meterHeight = 8;

    this.draftMeterBg = this.add
      .rectangle(this.player.x, this.player.y - 62, meterWidth, meterHeight, THEME.TOKENS.draftMeterBg)
      .setDepth(11)
      .setVisible(false);

    this.draftMeterFill = this.add
      .rectangle(
        this.player.x - meterWidth / 2,
        this.player.y - 62,
        0,
        meterHeight - 2,
        THEME.TOKENS.draftMeterFill
      )
      .setOrigin(0, 0.5)
      .setDepth(12)
      .setVisible(false);
  }

  private createScoreText(): void {
    this.scoreText = this.add
      .text(this.scale.width / 2, 16, '0', {
        fontFamily: 'Arial',
        fontSize: '40px',
        color: THEME.TOKENS.hudTextHex,
      })
      .setOrigin(0.5, 0)
      .setDepth(15)
      .setShadow(0, 2, THEME.TOKENS.hudShadowHex, 4, false, true);
  }

  private createChainText(): void {
    this.chainText = this.add
      .text(this.scale.width / 2, 86, 'x0', {
        fontFamily: 'Arial',
        fontSize: '30px',
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
        THEME.TOKENS.milestoneFlash
      )
      .setDepth(40)
      .setAlpha(0)
      .setVisible(false);
  }

  private createPerfectText(): void {
    this.perfectText = this.add
      .text(this.scale.width / 2, this.scale.height * 0.36, 'PERFECT!', {
        fontFamily: 'Arial',
        fontSize: '58px',
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
    const burstSpeed = this.burstRemainingMs > 0 ? CONFIG.SLINGSHOT_SPEED_BURST : 0;
    const scrollStep = (CONFIG.BASE_SCROLL_SPEED + burstSpeed) * speedScale;
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
    this.handleDraftEnd();

    this.tweens.add({
      targets: this.player,
      scaleX: 1.15,
      scaleY: 0.9,
      duration: 70,
      yoyo: true,
      ease: 'Sine.Out',
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
      ease: 'Back.easeOut',
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
      CONFIG.DRAFT_GLOW_PULSE_SPEED - chainIntensityFor(this.currentChain) * 350,
      260,
      CONFIG.DRAFT_GLOW_PULSE_SPEED
    );
    this.draftGlowTween = this.tweens.add({
      targets: vehicle,
      alpha: 0.7,
      duration: glowPulseMs / 2,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
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
      line.y += speedLineVelocity;
      line.alpha = Math.max(0, line.alpha - 0.025 * speedScale);
      if (line.y - line.height / 2 > this.scale.height + 24 || line.alpha <= 0) {
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
      CONFIG.SPEED_LINES_FREQUENCY
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
          this.scale.width - 6
        );
    const y = Phaser.Math.Between(0, this.scale.height - 120);
    const line = this.add
      .rectangle(x, y, Phaser.Math.Between(2, 4), Phaser.Math.Between(18, 34), THEME.TOKENS.speedLine)
      .setDepth(14)
      .setAlpha(
        Phaser.Math.Clamp(
          CONFIG.SPEED_LINES_BASE_ALPHA + intensity * 0.35,
          CONFIG.SPEED_LINES_BASE_ALPHA,
          CONFIG.SPEED_LINES_MAX_ALPHA
        )
      );
    this.speedLines.push(line);
  }

  private updatePlayerTrail(delta: number): void {
    const speedFactor = Phaser.Math.Clamp(this.currentScrollStep / CONFIG.BASE_SCROLL_SPEED, 1, 2.6);
    const moveScale = delta / (1000 / 60);
    const isSwipingBetweenLanes = Math.abs(this.player.x - this.previousPlayerX) > 0.1;
    const baseCatchupRate = 0.12 * moveScale;
    const catchupRate = isSwipingBetweenLanes ? baseCatchupRate : baseCatchupRate;

    for (let i = this.playerTrailPoints.length - 1; i >= 0; i -= 1) {
      const point = this.playerTrailPoints[i];
      point.lifeMs -= delta;

      if (point.lifeMs <= 0) {
        this.playerTrailPoints.splice(i, 1);
        continue;
      }

      point.y += this.currentScrollStep * 1.1 * moveScale;
      point.x += (this.player.x - point.x) * catchupRate;
    }

    this.trailSpawnAccumulatorMs += delta;
    const spawnIntervalMs = Phaser.Math.Clamp(48 / speedFactor, 14, 48);
    while (this.trailSpawnAccumulatorMs >= spawnIntervalMs) {
      this.trailSpawnAccumulatorMs -= spawnIntervalMs;
      this.spawnPlayerTrailPoint(speedFactor);
    }

    this.renderPlayerTrail(speedFactor);
    this.previousPlayerX = this.player.x;
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

  private renderPlayerTrail(speedFactor: number): void {
    this.playerTrailGraphics.clear();

    if (this.playerTrailPoints.length < 2) {
      return;
    }

    const smoothed = this.buildSmoothedTrailPoints(this.playerTrailPoints);
    if (smoothed.length < 2) {
      return;
    }

    const n = smoothed.length;
    const headWidth = this.player.width * 0.75;
    const tailWidth = this.player.width * 0.25;
    const overallAlpha = Phaser.Math.Clamp(0.7 + (speedFactor - 1) * 0.2, 0.7, 1);

    for (let i = 0; i < n - 1; i += 1) {
      const p0 = smoothed[i];
      const p1 = smoothed[i + 1];
      const prev = smoothed[Math.max(0, i - 1)];
      const next = smoothed[Math.min(n - 1, i + 2)];

      const tangent0 = new Phaser.Math.Vector2(p1.x - prev.x, p1.y - prev.y).normalize();
      const tangent1 = new Phaser.Math.Vector2(next.x - p0.x, next.y - p0.y).normalize();
      const normal0 = new Phaser.Math.Vector2(-tangent0.y, tangent0.x);
      const normal1 = new Phaser.Math.Vector2(-tangent1.y, tangent1.x);

      const t0 = i / (n - 1);
      const t1 = (i + 1) / (n - 1);
      const width0 = Phaser.Math.Linear(headWidth, tailWidth, t0);
      const width1 = Phaser.Math.Linear(headWidth, tailWidth, t1);

      const l0 = new Phaser.Math.Vector2(p0.x + normal0.x * (width0 * 0.5), p0.y + normal0.y * (width0 * 0.5));
      const r0 = new Phaser.Math.Vector2(p0.x - normal0.x * (width0 * 0.5), p0.y - normal0.y * (width0 * 0.5));
      const l1 = new Phaser.Math.Vector2(p1.x + normal1.x * (width1 * 0.5), p1.y + normal1.y * (width1 * 0.5));
      const r1 = new Phaser.Math.Vector2(p1.x - normal1.x * (width1 * 0.5), p1.y - normal1.y * (width1 * 0.5));

      // Fade from fully opaque at the start to fully transparent at the end.
      const segmentAlpha = overallAlpha * (1 - (t0 + t1) * 0.5);
      this.playerTrailGraphics.fillStyle(THEME.TOKENS.playerTrail, Phaser.Math.Clamp(segmentAlpha, 0, 1));
      this.playerTrailGraphics.beginPath();
      this.playerTrailGraphics.moveTo(l0.x, l0.y);
      this.playerTrailGraphics.lineTo(l1.x, l1.y);
      this.playerTrailGraphics.lineTo(r1.x, r1.y);
      this.playerTrailGraphics.lineTo(r0.x, r0.y);
      this.playerTrailGraphics.closePath();
      this.playerTrailGraphics.fillPath();
    }
  }

  private buildSmoothedTrailPoints(
    points: Array<{ x: number; y: number; lifeMs: number; maxLifeMs: number }>
  ): Phaser.Math.Vector2[] {
    let smoothed = points.map((p) => new Phaser.Math.Vector2(p.x, p.y));
    if (smoothed.length < 3) {
      return smoothed;
    }

    // Chaikin smoothing keeps the curve smooth without Catmull overshoot/self-intersections.
    const iterations = 2;
    for (let iter = 0; iter < iterations; iter += 1) {
      const next: Phaser.Math.Vector2[] = [smoothed[0].clone()];
      for (let i = 0; i < smoothed.length - 1; i += 1) {
        const p0 = smoothed[i];
        const p1 = smoothed[i + 1];
        const q = new Phaser.Math.Vector2(0.75 * p0.x + 0.25 * p1.x, 0.75 * p0.y + 0.25 * p1.y);
        const r = new Phaser.Math.Vector2(0.25 * p0.x + 0.75 * p1.x, 0.25 * p0.y + 0.75 * p1.y);
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
      ease: 'Quad.Out',
      onComplete: () => {
        this.flashOverlay.setVisible(false);
      },
    });

    this.tweens.killTweensOf(this.perfectText);
    this.perfectText.setVisible(true).setAlpha(1).setScale(0.84).setY(this.scale.height * 0.38);
    this.tweens.add({
      targets: this.perfectText,
      y: this.scale.height * 0.33,
      scale: 1,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.Out',
      onComplete: () => {
        this.perfectText.setVisible(false);
      },
    });
  }

  private updateSkyGradient(): void {
    const distance = this.scoreManager.getDistancePx();
    const segmentLength = CONFIG.SKY_TRANSITION_DISTANCE;
    const colorCount = THEME.SKY_GRADIENT.length;

    if (colorCount < 2) {
      return;
    }

    const phase = distance / segmentLength;
    const wrappedPhase = ((phase % colorCount) + colorCount) % colorCount;
    const fromIndex = Math.floor(wrappedPhase);
    const toIndex = (fromIndex + 1) % colorCount;
    const t = wrappedPhase - fromIndex;

    const from = Phaser.Display.Color.HexStringToColor(THEME.SKY_GRADIENT[fromIndex]);
    const to = Phaser.Display.Color.HexStringToColor(THEME.SKY_GRADIENT[toIndex]);
    const lerped = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 1, t);
    const colorValue = Phaser.Display.Color.GetColor(lerped.r, lerped.g, lerped.b);
    this.skyBg.setFillStyle(colorValue, 1);
  }

  private handleCollision(): void {
    if (this.isRunOver) {
      return;
    }

    this.isRunOver = true;
    this.chainManager.resetChain('collision');
    this.scene.start('GameOverScene', {
      score: Math.floor(this.scoreManager.getScore()),
      bestChain: this.chainManager.getBestChain(),
      distance: Math.floor(this.scoreManager.getDistancePx()),
    });
  }

  private resetRunState(): void {
    this.isRunOver = false;
    this.burstRemainingMs = 0;
    this.isDraftFxActive = false;
    this.activeDraftVehicle = null;
    this.speedLineSpawnAccumulatorMs = 0;
    this.trailSpawnAccumulatorMs = 0;
    this.currentChain = 0;
    this.currentScrollStep = CONFIG.BASE_SCROLL_SPEED;
    this.previousPlayerX = 0;
  }

  private clearPlayerTrail(): void {
    this.playerTrailPoints = [];
    this.playerTrailGraphics?.clear();
  }
}

function chainIntensityFor(chain: number): number {
  return Phaser.Math.Clamp(chain / 12, 0, 1);
}
