import Phaser from 'phaser';
import { CONFIG } from '../config';

/**
 * LaneSystem — Manages the 3-lane grid and player lane-switching.
 *
 * Responsibilities:
 * - Touchdown: compare pointer world X to player center — left moves one lane left, right moves one lane right.
 * - While held (drag): map pointer X to a lane column (three lanes × LANE_WIDTH) and tween the player toward that lane.
 * - Arrow keys for desktop testing
 */
export class LaneSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Phaser.GameObjects.Rectangle;
  private readonly laneCenters: number[];
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  private currentLane = 1;
  private isSwitchingLane = false;

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
      this.snapCurrentLaneToNearest();
      const px = pointer.worldX;
      const cx = this.player.x;
      if (px < cx) {
        this.switchToLane(this.currentLane - 1);
      } else if (px > cx) {
        this.switchToLane(this.currentLane + 1);
      }
    };

    this.onPointerMove = (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) {
        return;
      }
      if (pointer.rightButtonDown()) {
        return;
      }
      const targetLane = this.laneIndexFromWorldX(pointer.worldX);
      this.switchToLane(targetLane);
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

  /** Which lane column (0…LANE_COUNT-1) contains this world X, using full lane strip width. */
  private laneIndexFromWorldX(px: number): number {
    const roadLeft = this.laneCenters[0] - CONFIG.LANE_WIDTH / 2;
    return Phaser.Math.Clamp(
      Math.floor((px - roadLeft) / CONFIG.LANE_WIDTH),
      0,
      CONFIG.LANE_COUNT - 1,
    );
  }

  /** Sync logical lane from player position (e.g. after killing a tween mid-flight). */
  private snapCurrentLaneToNearest(): void {
    this.currentLane = this.laneIndexFromWorldX(this.player.x);
  }

  private switchToLane(nextLane: number): void {
    const clamped = Phaser.Math.Clamp(nextLane, 0, CONFIG.LANE_COUNT - 1);

    if (clamped === this.currentLane && this.isSwitchingLane) {
      return;
    }
    if (
      clamped === this.currentLane &&
      Math.abs(this.player.x - this.laneCenters[clamped]) < 2
    ) {
      return;
    }

    this.scene.tweens.killTweensOf(this.player);
    this.isSwitchingLane = false;

    this.currentLane = clamped;
    this.isSwitchingLane = true;

    this.scene.tweens.add({
      targets: this.player,
      x: this.laneCenters[clamped],
      duration: CONFIG.LANE_SWITCH_DURATION,
      ease: CONFIG.LANE_SWITCH_EASE,
      onComplete: () => {
        this.isSwitchingLane = false;
      },
    });
  }
}
