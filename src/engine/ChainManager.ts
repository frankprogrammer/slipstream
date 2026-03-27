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
  // TODO: Implement
}
