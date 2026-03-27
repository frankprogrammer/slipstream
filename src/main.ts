import Phaser from 'phaser';
import { CONFIG } from './config';
import { THEME } from './skins/theme';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.GAME_WIDTH,
  height: CONFIG.GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: THEME.TOKENS.appBackgroundHex,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false, // Set to true during development
    },
  },
  scene: [GameScene, GameOverScene],
  input: {
    activePointers: 1,
  },
};

new Phaser.Game(config);
