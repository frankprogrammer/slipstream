import Phaser from 'phaser';
import { CONFIG } from '../config';
import { ChainManager } from '../engine/ChainManager';
import { CollisionSystem } from '../engine/CollisionSystem';
import { LaneSystem } from '../engine/LaneSystem';
import { ScoreManager } from '../engine/ScoreManager';
import { SlipstreamZone } from '../engine/SlipstreamZone';
import { TrafficSpawner } from '../engine/TrafficSpawner';

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
  private currentChain = 0;

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
    this.skyBg = this.add.rectangle(width / 2, height / 2, width, height, CONFIG.PALETTE.PEACH).setDepth(-3);
    this.roadBg = this.add
      .rectangle(width / 2, height / 2, this.roadWidth, height, CONFIG.PALETTE.WARM_GRAY)
      .setDepth(-2);

    this.createLaneDashes(height);
    this.createPlayer(height);
    this.createScoreText();
    this.createDraftMeter();
    this.createChainText();
    this.createPerfectText();
    this.laneSystem = new LaneSystem(this, this.player, this.laneCenters);
    this.trafficSpawner = new TrafficSpawner(this, this.laneCenters);
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
    this.updateSkyGradient();
    this.updateDraftMeterUI();
  }

  private createLaneDashes(height: number): void {
    for (let separator = 1; separator < CONFIG.LANE_COUNT; separator += 1) {
      const x = this.roadLeft + separator * CONFIG.LANE_WIDTH;
      for (let y = -this.dashLength; y <= height + this.dashLength; y += this.dashLength + this.dashGap) {
        const dash = this.add
          .rectangle(x, y, 6, this.dashLength, CONFIG.PALETTE.CREAM)
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
        CONFIG.PALETTE.CORAL
      )
      .setStrokeStyle(3, CONFIG.PALETTE.CREAM);
  }

  private createDraftMeter(): void {
    const meterWidth = 56;
    const meterHeight = 8;

    this.draftMeterBg = this.add
      .rectangle(this.player.x, this.player.y - 62, meterWidth, meterHeight, CONFIG.PALETTE.SOFT_BROWN)
      .setDepth(11)
      .setVisible(false);

    this.draftMeterFill = this.add
      .rectangle(
        this.player.x - meterWidth / 2,
        this.player.y - 62,
        0,
        meterHeight - 2,
        CONFIG.PALETTE.AMBER
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
        color: '#FFF8F0',
      })
      .setOrigin(0.5, 0)
      .setDepth(15)
      .setShadow(0, 2, '#4A3F35', 4, false, true);
  }

  private createChainText(): void {
    this.chainText = this.add
      .text(this.scale.width / 2, 86, 'x0', {
        fontFamily: 'Arial',
        fontSize: '30px',
        color: '#FFF8F0',
      })
      .setOrigin(0.5, 0)
      .setDepth(15)
      .setShadow(0, 2, '#4A3F35', 4, false, true);
  }

  private createFlashOverlay(): void {
    this.flashOverlay = this.add
      .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0xF5A623)
      .setDepth(40)
      .setAlpha(0)
      .setVisible(false);
  }

  private createPerfectText(): void {
    this.perfectText = this.add
      .text(this.scale.width / 2, this.scale.height * 0.36, 'PERFECT!', {
        fontFamily: 'Arial',
        fontSize: '58px',
        color: '#FFF8F0',
      })
      .setOrigin(0.5)
      .setDepth(41)
      .setAlpha(0)
      .setScale(0.8)
      .setVisible(false)
      .setShadow(0, 2, '#4A3F35', 4, false, true);
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
    vehicle.setStrokeStyle(4, CONFIG.DRAFT_GLOW_COLOR);
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
      this.activeDraftVehicle.setStrokeStyle(2, CONFIG.PALETTE.CREAM);
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
      .rectangle(x, y, Phaser.Math.Between(2, 4), Phaser.Math.Between(18, 34), CONFIG.PALETTE.CREAM)
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
    const colorCount = CONFIG.SKY_GRADIENT_COLORS.length;

    if (colorCount < 2) {
      return;
    }

    const phase = distance / segmentLength;
    const wrappedPhase = ((phase % colorCount) + colorCount) % colorCount;
    const fromIndex = Math.floor(wrappedPhase);
    const toIndex = (fromIndex + 1) % colorCount;
    const t = wrappedPhase - fromIndex;

    const from = Phaser.Display.Color.HexStringToColor(CONFIG.SKY_GRADIENT_COLORS[fromIndex]);
    const to = Phaser.Display.Color.HexStringToColor(CONFIG.SKY_GRADIENT_COLORS[toIndex]);
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
    this.currentChain = 0;
  }
}

function chainIntensityFor(chain: number): number {
  return Phaser.Math.Clamp(chain / 12, 0, 1);
}
