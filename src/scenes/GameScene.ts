import Phaser from 'phaser';
import { CONFIG } from '../config';
import { LaneSystem } from '../engine/LaneSystem';
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

  private roadDashes: Phaser.GameObjects.Rectangle[] = [];

  private roadLeft = 0;
  private roadWidth = 0;
  private readonly dashLength = 36;
  private readonly dashGap = 28;

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
    this.laneSystem = new LaneSystem(this, this.player, this.laneCenters);
    this.trafficSpawner = new TrafficSpawner(this, this.laneCenters);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.laneSystem.destroy();
      this.trafficSpawner.destroy();
    });
  }

  update(time: number, delta: number): void {
    void time;

    this.laneSystem.update();
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
