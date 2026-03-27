import Phaser from "phaser";

/**
 * CollisionSystem — Player vs vehicle collision detection.
 *
 * Uses Phaser Arcade Physics overlap/collider.
 *
 * ONLY death trigger: player body overlaps a vehicle body.
 * No other death conditions. No edge-of-road. No timer. No health.
 *
 * On collision:
 * 1. Freeze gameplay instantly
 * 2. Brief screen shake (2 frames)
 * 3. Transition to GameOverScene with run data
 * 4. Total time from collision to GameOverScene visible: < 500ms
 */
export class CollisionSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Phaser.GameObjects.Rectangle;
  private readonly getTrafficVehicles: () => readonly Phaser.GameObjects.Rectangle[];
  private readonly onCollision: () => void;

  private readonly playerBounds = new Phaser.Geom.Rectangle();
  private readonly vehicleBounds = new Phaser.Geom.Rectangle();
  private collided = false;

  constructor(
    scene: Phaser.Scene,
    player: Phaser.GameObjects.Rectangle,
    getTrafficVehicles: () => readonly Phaser.GameObjects.Rectangle[],
    onCollision: () => void,
  ) {
    this.scene = scene;
    this.player = player;
    this.getTrafficVehicles = getTrafficVehicles;
    this.onCollision = onCollision;
  }

  update(): void {
    if (this.collided) {
      return;
    }

    this.player.getBounds(this.playerBounds);
    const verticalTrim = this.playerBounds.height * 0.1;
    this.playerBounds.y += verticalTrim;
    this.playerBounds.height -= verticalTrim * 2;
    for (const vehicle of this.getTrafficVehicles()) {
      vehicle.getBounds(this.vehicleBounds);
      if (
        !Phaser.Geom.Intersects.RectangleToRectangle(
          this.playerBounds,
          this.vehicleBounds,
        )
      ) {
        continue;
      }

      this.collided = true;
      this.scene.cameras.main.shake(30, 0.002);
      this.onCollision();
      return;
    }
  }

  destroy(): void {
    this.collided = true;
  }
}
