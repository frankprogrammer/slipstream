import { CONFIG } from '../config';

/**
 * ScrollManager — Handles parallax scrolling background layers.
 *
 * Three layers at different speeds (CONFIG.PARALLAX_SPEEDS):
 * - Layer 0 (sky): slowest, barely moves — creates depth
 * - Layer 1 (midground): hills, farmhouses, windmills — moderate speed
 * - Layer 2 (road): lane lines, road texture — fastest, matches vehicle scroll
 *
 * Each layer is a tiling sprite that wraps seamlessly.
 *
 * Speed scales with game progression:
 * - Base speed: CONFIG.BASE_SCROLL_SPEED
 * - Gradually increases at CONFIG.SPEED_RAMP_RATE per frame
 * - Capped at CONFIG.MAX_SCROLL_SPEED
 * - Slingshot bursts temporarily add CONFIG.SLINGSHOT_SPEED_BURST
 *
 * Sky gradient:
 * - Background color lerps through CONFIG.SKY_GRADIENT_COLORS
 * - Transition triggered by total distance (CONFIG.SKY_TRANSITION_DISTANCE per step)
 * - Should feel organic — player shouldn't notice until they look up and the sky has changed
 */
export class ScrollManager {
  // TODO: Implement
}
