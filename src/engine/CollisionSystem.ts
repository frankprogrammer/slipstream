import { CONFIG } from '../config';

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
  // TODO: Implement
}
