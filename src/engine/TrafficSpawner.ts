import Phaser from 'phaser';
import { CONFIG, TrafficPhase } from '../config';

/**
 * TrafficSpawner — Spawns and manages traffic vehicles.
 *
 * Phases (from CONFIG.TRAFFIC_PHASES):
 * - Determines current phase based on elapsed time
 * - Spawns vehicles at phase.spawnRate interval
 * - Only spawns in lanes listed in phase.lanes
 * - Applies phase.speedVariance to vehicle speed
 *
 * Vehicle behavior:
 * - Scroll downward at CONFIG.VEHICLE_BASE_SPEED (relative to road scroll)
 * - If phase.laneChange is true, some vehicles may change lanes
 * - Lane changes are telegraphed with a blinker CONFIG.VEHICLE_LANE_CHANGE_TELEGRAPH ms ahead
 *
 * Object pooling:
 * - Recycle vehicles that scroll below screen instead of destroying
 * - Keep pool size reasonable (max ~20 active vehicles)
 *
 * Vehicle types:
 * - CONFIG.VEHICLE_TYPES different visual types
 * - Randomly assigned on spawn
 * - Different sizes (trucks wider/taller, cars smaller) — affects slipstream zone
 */
export class TrafficSpawner {
  private readonly scene: Phaser.Scene;
  private readonly laneCenters: number[];
  private vehicles: Phaser.GameObjects.Rectangle[] = [];
  private vehicleSpeeds: number[] = [];
  private spawnAccumulatorMs = 0;
  private elapsedMs = 0;

  constructor(scene: Phaser.Scene, laneCenters: number[]) {
    this.scene = scene;
    this.laneCenters = laneCenters;
  }

  update(delta: number): void {
    this.elapsedMs += delta;
    this.spawnAccumulatorMs += delta;

    const phase = this.getCurrentPhase();
    while (this.spawnAccumulatorMs >= phase.spawnRate) {
      this.spawnAccumulatorMs -= phase.spawnRate;
      this.spawnVehicle(phase);
    }

    const speedScale = delta / (1000 / 60);
    for (let i = this.vehicles.length - 1; i >= 0; i -= 1) {
      const vehicle = this.vehicles[i];
      vehicle.y += this.vehicleSpeeds[i] * speedScale;

      if (vehicle.y - vehicle.height / 2 > this.scene.scale.height + 24) {
        vehicle.destroy();
        this.vehicles.splice(i, 1);
        this.vehicleSpeeds.splice(i, 1);
      }
    }
  }

  destroy(): void {
    for (const vehicle of this.vehicles) {
      vehicle.destroy();
    }
    this.vehicles = [];
    this.vehicleSpeeds = [];
  }

  private getCurrentPhase(): TrafficPhase {
    let phase = CONFIG.TRAFFIC_PHASES[0];
    for (const candidate of CONFIG.TRAFFIC_PHASES) {
      if (candidate.startTime <= this.elapsedMs) {
        phase = candidate;
      } else {
        break;
      }
    }
    return phase;
  }

  private spawnVehicle(phase: TrafficPhase): void {
    const laneIndex = Phaser.Utils.Array.GetRandom(phase.lanes);
    const width = CONFIG.LANE_WIDTH * Phaser.Math.FloatBetween(0.5, 0.68);
    const height = Phaser.Math.Between(70, 95);

    const variance = Phaser.Math.FloatBetween(-phase.speedVariance, phase.speedVariance);
    const speed = (CONFIG.VEHICLE_BASE_SPEED + CONFIG.BASE_SCROLL_SPEED) * (1 + variance);

    const vehicle = this.scene.add
      .rectangle(this.laneCenters[laneIndex], -height, width, height, CONFIG.PALETTE.SOFT_BROWN)
      .setStrokeStyle(2, CONFIG.PALETTE.CREAM);

    this.vehicles.push(vehicle);
    this.vehicleSpeeds.push(Math.max(1.2, speed));
  }
}
