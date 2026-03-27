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
  // TODO: Implement
}
