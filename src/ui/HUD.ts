import Phaser from 'phaser';
import { CONFIG } from '../config';
import { THEME } from '../skins/theme';

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
  private readonly scene: Phaser.Scene;
  private scoreText: Phaser.GameObjects.Text;
  private chainText: Phaser.GameObjects.Text;
  private draftMeterBg: Phaser.GameObjects.Rectangle;
  private draftMeterFill: Phaser.GameObjects.Rectangle;
  private perfectText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.scoreText = this.scene.add
      .text(this.scene.scale.width / 2, 16, '0', {
        fontFamily: 'Arial',
        fontSize: '40px',
        color: THEME.TOKENS.hudTextHex,
      })
      .setOrigin(0.5, 0)
      .setDepth(15)
      .setShadow(0, 2, THEME.TOKENS.hudShadowHex, 4, false, true);

    this.chainText = this.scene.add
      .text(this.scene.scale.width / 2, 86, 'x0', {
        fontFamily: 'Arial',
        fontSize: '30px',
        color: THEME.TOKENS.hudTextHex,
      })
      .setOrigin(0.5, 0)
      .setDepth(15)
      .setShadow(0, 2, THEME.TOKENS.hudShadowHex, 4, false, true);

    this.draftMeterBg = this.scene.add
      .rectangle(0, 0, 56, 8, THEME.TOKENS.draftMeterBg)
      .setDepth(11)
      .setVisible(false);

    this.draftMeterFill = this.scene.add
      .rectangle(0, 0, 0, 6, THEME.TOKENS.draftMeterFill)
      .setOrigin(0, 0.5)
      .setDepth(12)
      .setVisible(false);

    this.perfectText = this.scene.add
      .text(this.scene.scale.width / 2, this.scene.scale.height * 0.36, 'PERFECT!', {
        fontFamily: 'Arial',
        fontSize: '58px',
        color: THEME.TOKENS.hudTextHex,
      })
      .setOrigin(0.5)
      .setDepth(41)
      .setAlpha(0)
      .setVisible(false)
      .setShadow(0, 2, THEME.TOKENS.hudShadowHex, 4, false, true);
  }

  setScore(score: number): void {
    this.scoreText.setText(`${Math.floor(score)}`);
  }

  setChain(chain: number): void {
    this.chainText.setText(`x${chain}`);
    this.chainText.setScale(CONFIG.CHAIN_POP_SCALE);
    this.scene.tweens.add({
      targets: this.chainText,
      scale: 1,
      duration: CONFIG.CHAIN_POP_DURATION,
      ease: 'Back.easeOut',
    });
  }

  setDraftMeter(playerX: number, playerY: number, ratio: number, visible: boolean): void {
    const meterY = playerY - 62;
    const meterWidth = this.draftMeterBg.width;
    this.draftMeterBg.setPosition(playerX, meterY).setVisible(visible);
    this.draftMeterFill
      .setPosition(playerX - meterWidth / 2, meterY)
      .setSize(meterWidth * Phaser.Math.Clamp(ratio, 0, 1), this.draftMeterFill.height)
      .setVisible(visible);
  }

  showPerfect(): void {
    this.scene.tweens.killTweensOf(this.perfectText);
    this.perfectText.setVisible(true).setAlpha(1).setScale(0.84).setY(this.scene.scale.height * 0.38);
    this.scene.tweens.add({
      targets: this.perfectText,
      y: this.scene.scale.height * 0.33,
      scale: 1,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.Out',
      onComplete: () => {
        this.perfectText.setVisible(false);
      },
    });
  }

  destroy(): void {
    this.scoreText.destroy();
    this.chainText.destroy();
    this.draftMeterBg.destroy();
    this.draftMeterFill.destroy();
    this.perfectText.destroy();
  }
}
