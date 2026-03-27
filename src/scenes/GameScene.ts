import Phaser from 'phaser';
import { CONFIG } from '../config';
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
  private currentLane = 1;
  private isSwitchingLane = false;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private player!: Phaser.GameObjects.Rectangle;
  private trafficSpawner!: TrafficSpawner;

  private roadDashes: Phaser.GameObjects.Rectangle[] = [];

  private roadLeft = 0;
  private roadWidth = 0;
  private readonly dashLength = 36;
  private readonly dashGap = 28;
  private swipeStartX = 0;
  private swipeStartY = 0;
  private swipeStartTime = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // TODO: Load assets from skin manifest
    // For now, we use generated rectangles (no assets needed for prototype)
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.roadWidth = CONFIG.LANE_COUNT * CONFIG.LANE_WIDTH;
    this.roadLeft = Math.floor((width - this.roadWidth) / 2);

    this.laneCenters = Array.from({ length: CONFIG.LANE_COUNT }, (_, lane) => {
      return this.roadLeft + (lane + 0.5) * CONFIG.LANE_WIDTH;
    });

    // Warm sunset shoulder color around the road.
    this.add.rectangle(width / 2, height / 2, width, height, CONFIG.PALETTE.PEACH).setDepth(-3);
    this.add.rectangle(width / 2, height / 2, this.roadWidth, height, CONFIG.PALETTE.WARM_GRAY).setDepth(-2);

    this.createLaneDashes(height);
    this.createPlayer(height);
    this.trafficSpawner = new TrafficSpawner(this, this.laneCenters);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.trafficSpawner.destroy());

    this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
    this.registerSwipeInput();
  }

  update(time: number, delta: number): void {
    void time;

    this.handleLaneInput();
    this.scrollRoad(delta);
    this.trafficSpawner.update(delta);
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
    this.player = this.add
      .rectangle(
        this.laneCenters[this.currentLane],
        playerY,
        CONFIG.LANE_WIDTH * 0.45,
        72,
        CONFIG.PALETTE.CORAL
      )
      .setStrokeStyle(3, CONFIG.PALETTE.CREAM);
  }

  private handleLaneInput(): void {
    if (this.isSwitchingLane) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      this.switchToLane(this.currentLane - 1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      this.switchToLane(this.currentLane + 1);
    }
  }

  private registerSwipeInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.swipeStartX = pointer.x;
      this.swipeStartY = pointer.y;
      this.swipeStartTime = this.time.now;
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const elapsed = this.time.now - this.swipeStartTime;
      if (elapsed > CONFIG.SWIPE_MAX_TIME) {
        return;
      }

      const deltaX = pointer.x - this.swipeStartX;
      const deltaY = pointer.y - this.swipeStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Horizontal intent only: ignore taps and mostly-vertical gestures.
      if (absX < CONFIG.SWIPE_THRESHOLD || absX <= absY) {
        return;
      }

      if (deltaX > 0) {
        this.switchToLane(this.currentLane + 1);
      } else {
        this.switchToLane(this.currentLane - 1);
      }
    });
  }

  private switchToLane(nextLane: number): void {
    const clampedLane = Phaser.Math.Clamp(nextLane, 0, CONFIG.LANE_COUNT - 1);
    if (clampedLane === this.currentLane) {
      return;
    }

    this.currentLane = clampedLane;
    this.isSwitchingLane = true;

    this.tweens.add({
      targets: this.player,
      x: this.laneCenters[clampedLane],
      duration: CONFIG.LANE_SWITCH_DURATION,
      ease: CONFIG.LANE_SWITCH_EASE,
      onComplete: () => {
        this.isSwitchingLane = false;
      },
    });
  }

  private scrollRoad(delta: number): void {
    const speedScale = delta / (1000 / 60);
    const scrollStep = CONFIG.BASE_SCROLL_SPEED * speedScale;
    const wrapY = this.scale.height + this.dashLength;

    for (const dash of this.roadDashes) {
      dash.y += scrollStep;
      if (dash.y > wrapY) {
        dash.y = -this.dashLength;
      }
    }
  }
}
