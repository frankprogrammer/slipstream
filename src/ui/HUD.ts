import { CONFIG } from '../config';

/**
 * HUD — Heads-up display overlay during gameplay.
 *
 * Absolutely minimal. Only these elements:
 * 1. Score — top center, always visible
 * 2. Chain multiplier — below score, shows "×N", pops on increment
 * 3. Draft meter — small arc near player, ONLY visible when drafting
 *
 * No pause button. No lives. No coins. No clutter.
 *
 * The chain counter has a scale-pop tween on each increment:
 * - Scale to CONFIG.CHAIN_POP_SCALE (1.3x)
 * - Ease back to 1.0x over CONFIG.CHAIN_POP_DURATION (200ms)
 *
 * At chain milestone ×10:
 * - "PERFECT" text appears center screen
 * - Fades out over 1 second
 * - Gold screen flash overlay (CONFIG.SCREEN_FLASH_DURATION)
 */
export class HUD {
  // TODO: Implement
}
