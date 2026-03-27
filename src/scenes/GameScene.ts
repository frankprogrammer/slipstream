import Phaser from 'phaser';
import { CONFIG } from '../config';

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
  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // TODO: Load assets from skin manifest
    // For now, we use generated rectangles (no assets needed for prototype)
  }

  create(): void {
    // TODO: Initialize in this order:
    // 1. ScrollManager (parallax layers)
    // 2. Lane system (road, lane lines)
    // 3. Player vehicle (positioned at CONFIG.PLAYER_Y_POSITION)
    // 4. Traffic spawner
    // 5. Slipstream zone system
    // 6. Chain manager
    // 7. Score manager
    // 8. HUD
    // 9. Input (swipe detection + keyboard)
    // 10. Collision system

    console.log('GameScene created — implement me! See CLAUDE.md for specs.');
  }

  update(time: number, delta: number): void {
    // TODO: Per-frame updates:
    // 1. Scroll background layers
    // 2. Update traffic positions
    // 3. Check slipstream zone overlap
    // 4. Update draft meter if drafting
    // 5. Check chain timeout
    // 6. Update score
    // 7. Update sky gradient based on distance
    // 8. Check collisions
  }
}
