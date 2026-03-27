import { THEME } from '../skins/theme';

/**
 * ShareCard — Generates a shareable end-of-run image.
 *
 * Shows:
 * - Player vehicle on road
 * - Final chain count in large text
 * - Sky gradient from the run (unique per run based on distance)
 * - Score
 *
 * Uses Phaser's snapshot or canvas API to generate a PNG.
 * Triggered by share button on GameOverScene.
 */
export class ShareCard {
  generate(data: { score: number; bestChain: number; distance: number }): string {
    const width = 720;
    const height = 1280;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return '';
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, THEME.TOKENS.shareGradientStartHex);
    gradient.addColorStop(1, THEME.TOKENS.shareGradientEndHex);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = THEME.TOKENS.sharePanelHex;
    ctx.fillRect(120, 180, 480, 920);

    ctx.fillStyle = THEME.TOKENS.shareTextHex;
    ctx.textAlign = 'center';
    ctx.font = 'bold 64px system-ui';
    ctx.fillText('SLIPSTREAM', width / 2, 280);

    ctx.font = 'bold 140px system-ui';
    ctx.fillText(`${Math.floor(data.score)}`, width / 2, 460);

    ctx.font = '36px system-ui';
    ctx.fillText('SCORE', width / 2, 520);

    ctx.font = 'bold 48px system-ui';
    ctx.fillText(`BEST CHAIN x${Math.floor(data.bestChain)}`, width / 2, 640);
    ctx.fillText(`DISTANCE ${Math.floor(data.distance)}`, width / 2, 720);

    ctx.font = '32px system-ui';
    ctx.fillStyle = THEME.TOKENS.shareAccentHex;
    ctx.fillText('cozy nostalgia run', width / 2, 980);

    return canvas.toDataURL('image/png');
  }

  download(data: { score: number; bestChain: number; distance: number }): void {
    const url = this.generate(data);
    if (!url) {
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = `slipstream-${Date.now()}.png`;
    link.click();
  }
}
