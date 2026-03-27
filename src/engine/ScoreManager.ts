import Phaser from 'phaser';
import { CONFIG } from '../config';

/**
 * ScoreManager — Calculates and tracks all scoring.
 *
 * Three score sources feeding one number:
 * 1. Distance: CONFIG.DISTANCE_SCORE_RATE point per CONFIG.DISTANCE_SCORE_INTERVAL pixels
 * 2. Slipstream bonus: CONFIG.CHAIN_SCORE_BASE × chain_multiplier per draft-complete
 * 3. Milestone bonus: burst of points at chain milestones
 *
 * Tracks:
 * - Current score
 * - Total distance (pixels scrolled)
 * - Personal best (persisted to localStorage)
 */
export class ScoreManager {
  private readonly scene: Phaser.Scene;
  private score = 0;
  private distancePx = 0;
  private distanceAccumulatorPx = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  addDistance(scrolledPixels: number): void {
    this.distancePx += scrolledPixels;
    this.distanceAccumulatorPx += scrolledPixels;

    while (this.distanceAccumulatorPx >= CONFIG.DISTANCE_SCORE_INTERVAL) {
      this.distanceAccumulatorPx -= CONFIG.DISTANCE_SCORE_INTERVAL;
      this.score += CONFIG.DISTANCE_SCORE_RATE;
    }

    this.scene.events.emit('score-changed', this.score);
  }

  addDraftCompleteBonus(chain: number): void {
    this.score += CONFIG.CHAIN_SCORE_BASE * chain;
    this.scene.events.emit('score-changed', this.score);
  }

  getScore(): number {
    return this.score;
  }

  getDistancePx(): number {
    return this.distancePx;
  }
}
