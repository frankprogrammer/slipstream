import Phaser from 'phaser';
import { CONFIG } from '../config';

/**
 * ChainManager — Tracks the slipstream chain multiplier.
 *
 * - Increments on each 'draft-complete' event
 * - Resets on collision or CONFIG.CHAIN_TIMEOUT ms without drafting
 * - Emits 'chain-milestone' at CONFIG.CHAIN_MILESTONES thresholds
 * - Tracks best chain for end-of-run stats
 *
 * Milestone effects (handled by GameScene):
 * - ×5: ding sound
 * - ×10: gold screen flash + "PERFECT" text + full chord sound (THE clip moment)
 * - ×15: cascading arpeggio sound
 * - ×20: euphoric sound
 */
export class ChainManager {
  private readonly scene: Phaser.Scene;
  private currentChain = 0;
  private bestChain = 0;
  private timeSinceDraftMs = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(delta: number, isDrafting: boolean): void {
    if (isDrafting) {
      this.timeSinceDraftMs = 0;
      return;
    }

    this.timeSinceDraftMs += delta;
    if (this.currentChain > 0 && this.timeSinceDraftMs >= CONFIG.CHAIN_TIMEOUT) {
      this.resetChain('timeout');
    }
  }

  completeDraft(): number {
    this.currentChain += 1;
    this.bestChain = Math.max(this.bestChain, this.currentChain);
    this.timeSinceDraftMs = 0;

    this.scene.events.emit('chain-changed', this.currentChain);
    if (CONFIG.CHAIN_MILESTONES.includes(this.currentChain)) {
      this.scene.events.emit('chain-milestone', this.currentChain);
    }

    return this.currentChain;
  }

  resetChain(reason: 'collision' | 'timeout'): void {
    if (this.currentChain === 0) {
      return;
    }

    this.currentChain = 0;
    this.timeSinceDraftMs = 0;
    this.scene.events.emit('chain-reset', reason);
    this.scene.events.emit('chain-changed', this.currentChain);
  }

  getCurrentChain(): number {
    return this.currentChain;
  }

  getBestChain(): number {
    return this.bestChain;
  }
}
