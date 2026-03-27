import Phaser from 'phaser';
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
  private currentSpeed: number = CONFIG.BASE_SCROLL_SPEED;
  private burstRemainingMs = 0;

  update(delta: number): void {
    const frameScale = delta / (1000 / 60);
    this.currentSpeed = Math.min(
      CONFIG.MAX_SCROLL_SPEED,
      this.currentSpeed + CONFIG.SPEED_RAMP_RATE * frameScale
    );
    this.burstRemainingMs = Math.max(0, this.burstRemainingMs - delta);
  }

  triggerBurst(durationMs = CONFIG.SLINGSHOT_BURST_DURATION): void {
    this.burstRemainingMs = Math.max(this.burstRemainingMs, durationMs);
  }

  getRoadScrollStep(delta: number): number {
    const speedScale = delta / (1000 / 60);
    const burst = this.burstRemainingMs > 0 ? CONFIG.SLINGSHOT_SPEED_BURST : 0;
    return (this.currentSpeed + burst) * speedScale;
  }

  getParallaxScrollStep(layerIndex: number, delta: number): number {
    const multiplier =
      CONFIG.PARALLAX_SPEEDS[layerIndex] ?? CONFIG.PARALLAX_SPEEDS[CONFIG.PARALLAX_SPEEDS.length - 1];
    return this.getRoadScrollStep(delta) * multiplier;
  }

  getSkyColor(distancePx: number): number {
    const colorCount = CONFIG.SKY_GRADIENT_COLORS.length;
    if (colorCount === 0) {
      return CONFIG.PALETTE.PEACH;
    }
    if (colorCount === 1) {
      return Phaser.Display.Color.HexStringToColor(CONFIG.SKY_GRADIENT_COLORS[0]).color;
    }

    const phase = distancePx / CONFIG.SKY_TRANSITION_DISTANCE;
    const wrappedPhase = ((phase % colorCount) + colorCount) % colorCount;
    const fromIndex = Math.floor(wrappedPhase);
    const toIndex = (fromIndex + 1) % colorCount;
    const t = wrappedPhase - fromIndex;

    const from = Phaser.Display.Color.HexStringToColor(CONFIG.SKY_GRADIENT_COLORS[fromIndex]);
    const to = Phaser.Display.Color.HexStringToColor(CONFIG.SKY_GRADIENT_COLORS[toIndex]);
    const lerped = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 1, t);
    return Phaser.Display.Color.GetColor(lerped.r, lerped.g, lerped.b);
  }
}
