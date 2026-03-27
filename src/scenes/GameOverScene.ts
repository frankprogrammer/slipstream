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
  private runData: RunData = {
    score: 0,
    bestChain: 0,
    distance: 0,
  };

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: RunData): void {
    this.runData = {
      score: data?.score ?? 0,
      bestChain: data?.bestChain ?? 0,
      distance: data?.distance ?? 0,
    };
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, CONFIG.PALETTE.TWILIGHT);

    this.add
      .text(width / 2, height * 0.17, 'GAME OVER', {
        fontFamily: 'Arial',
        fontSize: '38px',
        color: '#FFF8F0',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.28, `${this.runData.score}`, {
        fontFamily: 'Arial',
        fontSize: '72px',
        color: '#FFF8F0',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.38, 'SCORE', {
        fontFamily: 'Arial',
        fontSize: '22px',
        color: '#FFF8F0',
      })
      .setOrigin(0.5)
      .setAlpha(0.9);

    this.add
      .text(
        width / 2,
        height * 0.47,
        `BEST CHAIN x${this.runData.bestChain}   |   DIST ${this.runData.distance}`,
        {
          fontFamily: 'Arial',
          fontSize: '20px',
          color: '#FFF8F0',
        }
      )
      .setOrigin(0.5)
      .setAlpha(0.95);

    const retry = this.add
      .rectangle(width / 2, height * 0.62, 220, 72, CONFIG.PALETTE.AMBER)
      .setStrokeStyle(3, CONFIG.PALETTE.CREAM)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(retry.x, retry.y, 'RETRY', {
        fontFamily: 'Arial',
        fontSize: '34px',
        color: '#FFF8F0',
      })
      .setOrigin(0.5);

    retry.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}
