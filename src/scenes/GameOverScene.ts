import Phaser from 'phaser';
import { CONFIG } from '../config';

/**
 * GameOverScene — The single end-of-run screen.
 *
 * Displays: final score, best chain, distance, personal best.
 * Actions: Retry (instant restart), Share (generate result card).
 *
 * CRITICAL: Restart must be under 1 second from tap to playing.
 */

interface RunData {
  score: number;
  bestChain: number;
  distance: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: RunData): void {
    // TODO: Receive run data from GameScene
    console.log('GameOver — Score:', data.score, 'Chain:', data.bestChain, 'Distance:', data.distance);
  }

  create(): void {
    // TODO: Layout in this order:
    // 1. Sky gradient background (frozen at the color the run ended on)
    // 2. Final score (large, center, top third)
    // 3. Stats row: best chain | distance
    // 4. Personal best comparison (if new high score, celebrate)
    // 5. Retry button (giant, center screen — this is the most important element)
    // 6. Share button (smaller, below retry)

    // Retry button — tap to restart instantly
    // this.input.once('pointerdown', () => this.scene.start('GameScene'));

    console.log('GameOverScene created — implement me! See CLAUDE.md for specs.');
  }
}
