import Phaser from 'phaser';
import { CONFIG } from '../config';

/**
 * LaneSystem — Manages the 3-lane grid and player lane-switching.
 *
 * Responsibilities:
 * - Touchdown: compare pointer world X to player center — left moves one lane left, right moves one lane right.
 * - While held: each additional CONFIG.LANE_DRAG_STEP_PX horizontally from the anchor moves one more lane
 *   in that direction (anchor steps by LANE_DRAG_STEP_PX so multiple 10px chunks can chain across frames).
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

  /** World X reference for drag-step lane changes after touchdown. */
  private dragAnchorX = 0;

  private readonly onPointerDown: (pointer: Phaser.Input.Pointer) => void;
  private readonly onPointerMove: (pointer: Phaser.Input.Pointer) => void;

  constructor(scene: Phaser.Scene, player: Phaser.GameObjects.Rectangle, laneCenters: number[]) {
    this.scene = scene;
    this.player = player;
    this.laneCenters = laneCenters;
    this.currentLane = Math.floor(laneCenters.length / 2);

    this.onPointerDown = (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        return;
      }
      const px = pointer.worldX;
      const cx = this.player.x;
      if (!this.isSwitchingLane) {
        if (px < cx) {
          this.switchToLane(this.currentLane - 1);
        } else if (px > cx) {
          this.switchToLane(this.currentLane + 1);
        }
      }
      this.dragAnchorX = pointer.worldX;
    };

    this.onPointerMove = (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) {
        return;
      }
      if (pointer.rightButtonDown()) {
        return;
      }
      this.processDragSteps(pointer);
    };

    this.scene.input.on('pointerdown', this.onPointerDown);
    this.scene.input.on('pointermove', this.onPointerMove);

    this.cursors = this.scene.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
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
    this.scene.input.off('pointermove', this.onPointerMove);
  }

  private processDragSteps(pointer: Phaser.Input.Pointer): void {
    if (this.isSwitchingLane) {
      return;
    }

    const step = CONFIG.LANE_DRAG_STEP_PX;
    const px = pointer.worldX;
    let dx = px - this.dragAnchorX;

    if (dx >= step) {
      this.switchToLane(this.currentLane + 1);
      this.dragAnchorX += step;
    } else if (dx <= -step) {
      this.switchToLane(this.currentLane - 1);
      this.dragAnchorX -= step;
    }
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
