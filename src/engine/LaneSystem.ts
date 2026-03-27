import Phaser from 'phaser';
import { CONFIG } from '../config';

/**
 * LaneSystem — Manages the 3-lane grid and player lane-switching.
 *
 * Responsibilities:
 * - Track current lane (0=left, 1=center, 2=right)
 * - Convert lane index to X pixel position
 * - Animate lane-switch with tween (CONFIG.LANE_SWITCH_DURATION, CONFIG.LANE_SWITCH_EASE)
 * - Pointer (touch or mouse) on pointerdown: left of player center → left lane, right → right lane
 * - Arrow keys for desktop testing
 * - Prevent lane-switch during active tween
 */
export class LaneSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Phaser.GameObjects.Rectangle;
  private readonly laneCenters: number[];
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  private currentLane = 1;
  private isSwitchingLane = false;

  private readonly onPointerDown: (pointer: Phaser.Input.Pointer) => void;

  constructor(scene: Phaser.Scene, player: Phaser.GameObjects.Rectangle, laneCenters: number[]) {
    this.scene = scene;
    this.player = player;
    this.laneCenters = laneCenters;
    this.currentLane = Math.floor(laneCenters.length / 2);
    this.onPointerDown = (pointer: Phaser.Input.Pointer) => {
      if (this.isSwitchingLane) {
        return;
      }
      if (pointer.rightButtonDown()) {
        return;
      }
      const px = pointer.worldX;
      if (px < this.player.x) {
        this.switchToLane(this.currentLane - 1);
      } else if (px > this.player.x) {
        this.switchToLane(this.currentLane + 1);
      }
    };

    this.cursors = this.scene.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
    this.scene.input.on('pointerdown', this.onPointerDown);
  }

  update(): void {
    if (this.isSwitchingLane) {
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      this.switchToLane(this.currentLane - 1);
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      this.switchToLane(this.currentLane + 1);
    }
  }

  /** True while the lane-change tween is running. */
  isLaneSwitchActive(): boolean {
    return this.isSwitchingLane;
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onPointerDown);
  }

  private switchToLane(nextLane: number): void {
    const clampedLane = Phaser.Math.Clamp(nextLane, 0, CONFIG.LANE_COUNT - 1);
    if (clampedLane === this.currentLane) {
      return;
    }

    this.currentLane = clampedLane;
    this.isSwitchingLane = true;

    this.scene.tweens.add({
      targets: this.player,
      x: this.laneCenters[clampedLane],
      duration: CONFIG.LANE_SWITCH_DURATION,
      ease: CONFIG.LANE_SWITCH_EASE,
      onComplete: () => {
        this.isSwitchingLane = false;
      },
    });
  }
}
