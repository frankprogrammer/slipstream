import Phaser from 'phaser';
import { CONFIG } from '../config';

/**
 * LaneSystem — Manages the 3-lane grid and player lane-switching.
 *
 * Responsibilities:
 * - Track current lane (0=left, 1=center, 2=right)
 * - Convert lane index to X pixel position
 * - Animate lane-switch with tween (CONFIG.LANE_SWITCH_DURATION, CONFIG.LANE_SWITCH_EASE)
 * - Detect swipe input (touch) and arrow key input (keyboard)
 * - Prevent lane-switch during active tween (no double-swipe)
 *
 * Swipe detection:
 * - Track pointerdown position and time
 * - On pointerup, check if horizontal distance > CONFIG.SWIPE_THRESHOLD
 *   and elapsed time < CONFIG.SWIPE_MAX_TIME
 * - Direction: positive deltaX = right, negative = left
 */
export class LaneSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Phaser.GameObjects.Rectangle;
  private readonly laneCenters: number[];
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  private currentLane = 1;
  private isSwitchingLane = false;

  private swipeStartX = 0;
  private swipeStartY = 0;
  private swipeStartTime = 0;
  private readonly onPointerDown: (pointer: Phaser.Input.Pointer) => void;
  private readonly onPointerUp: (pointer: Phaser.Input.Pointer) => void;

  constructor(scene: Phaser.Scene, player: Phaser.GameObjects.Rectangle, laneCenters: number[]) {
    this.scene = scene;
    this.player = player;
    this.laneCenters = laneCenters;
    this.currentLane = Math.floor(laneCenters.length / 2);
    this.onPointerDown = (pointer: Phaser.Input.Pointer) => {
      this.swipeStartX = pointer.x;
      this.swipeStartY = pointer.y;
      this.swipeStartTime = this.scene.time.now;
    };
    this.onPointerUp = (pointer: Phaser.Input.Pointer) => {
      const elapsed = this.scene.time.now - this.swipeStartTime;
      if (elapsed > CONFIG.SWIPE_MAX_TIME) {
        return;
      }

      const deltaX = pointer.x - this.swipeStartX;
      const deltaY = pointer.y - this.swipeStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX < CONFIG.SWIPE_THRESHOLD || absX <= absY) {
        return;
      }

      if (deltaX > 0) {
        this.switchToLane(this.currentLane + 1);
      } else {
        this.switchToLane(this.currentLane - 1);
      }
    };

    this.cursors = this.scene.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
    this.registerSwipeInput();
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

  destroy(): void {
    this.scene.input.off('pointerdown', this.onPointerDown);
    this.scene.input.off('pointerup', this.onPointerUp);
  }

  private registerSwipeInput(): void {
    this.scene.input.on('pointerdown', this.onPointerDown);
    this.scene.input.on('pointerup', this.onPointerUp);
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
