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
  private readonly spawnLaneGap = 165;
  private readonly wallAvoidanceTimeWindowMs = 900;
  private readonly playerSafetyWindowPx = 220;
  private readonly maxActiveVehicles = 12;

  constructor(scene: Phaser.Scene, laneCenters: number[]) {
    this.scene = scene;
    this.laneCenters = laneCenters;
  }

  update(delta: number): void {
    this.elapsedMs += delta;
    this.spawnAccumulatorMs += delta;

    const phase = this.getCurrentPhase();
    while (this.spawnAccumulatorMs >= phase.spawnRate) {
      if (this.vehicles.length >= this.maxActiveVehicles) {
        this.spawnAccumulatorMs = phase.spawnRate;
        break;
      }

      if (!this.trySpawnVehicle(phase)) {
        // Lane is temporarily saturated (common in warm-up center-lane phase).
        // Retry soon instead of forcing overlapping spawns.
        this.spawnAccumulatorMs = phase.spawnRate;
        break;
      }
      this.spawnAccumulatorMs -= phase.spawnRate;
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

  getVehicles(): readonly Phaser.GameObjects.Rectangle[] {
    return this.vehicles;
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
    // Keep vehicles slower than the road pace so the player can settle into draft zones.
    const speed = CONFIG.VEHICLE_BASE_SPEED * (1 + variance);

    const vehicle = this.scene.add
      .rectangle(this.laneCenters[laneIndex], -height, width, height, CONFIG.PALETTE.SOFT_BROWN)
      .setStrokeStyle(2, CONFIG.PALETTE.CREAM);

    this.vehicles.push(vehicle);
    this.vehicleSpeeds.push(Math.max(0.8, speed));
  }

  private trySpawnVehicle(phase: TrafficPhase): boolean {
    // Use all lanes for now to keep early gameplay varied.
    const candidateLanes = this.laneCenters.map((_, index) => index);
    Phaser.Utils.Array.Shuffle(candidateLanes);
    const spawnSpec = this.createSpawnSpec(phase);

    for (const laneIndex of candidateLanes) {
      if (!this.canSpawnInLane(laneIndex, spawnSpec.speed, spawnSpec.height)) {
        continue;
      }
      this.spawnVehicleInLane(laneIndex, spawnSpec);
      return true;
    }

    return false;
  }

  private canSpawnInLane(laneIndex: number, spawnSpeed: number, spawnHeight: number): boolean {
    const laneX = this.laneCenters[laneIndex];
    const wallBlockingLanes = new Set<number>();
    const nearPlayerBlockedLanes = new Set<number>();
    const playerY = this.scene.scale.height * CONFIG.PLAYER_Y_POSITION;
    const spawnY = -spawnHeight;
    const spawnEtaMs = ((playerY - spawnY) / Math.max(0.1, spawnSpeed)) * (1000 / 60);

    for (const vehicle of this.vehicles) {
      const vehicleLane = this.getLaneIndexForX(vehicle.x);
      if (vehicleLane === -1) {
        continue;
      }

      if (vehicleLane === laneIndex && vehicle.y < this.spawnLaneGap) {
        return false;
      }

      if (Math.abs(vehicle.y - playerY) <= this.playerSafetyWindowPx) {
        nearPlayerBlockedLanes.add(vehicleLane);
      }

      const vehicleSpeed = this.getVehicleSpeed(vehicle);
      const vehicleEtaMs = ((playerY - vehicle.y) / Math.max(0.1, vehicleSpeed)) * (1000 / 60);
      if (vehicleEtaMs < 0) {
        continue;
      }

      if (Math.abs(vehicleEtaMs - spawnEtaMs) <= this.wallAvoidanceTimeWindowMs) {
        wallBlockingLanes.add(vehicleLane);
      }
    }

    // Never allow a new spawn that would create a three-lane "wall"
    // arriving around the player's y-position at the same time window.
    wallBlockingLanes.add(laneIndex);
    if (wallBlockingLanes.size >= CONFIG.LANE_COUNT) {
      return false;
    }

    // Also keep at least one lane open in the immediate player region.
    nearPlayerBlockedLanes.add(laneIndex);
    if (nearPlayerBlockedLanes.size >= CONFIG.LANE_COUNT) {
      return false;
    }

    return true;
  }

  private spawnVehicleInLane(
    laneIndex: number,
    spec: { width: number; height: number; speed: number }
  ): void {
    const vehicle = this.scene.add
      .rectangle(this.laneCenters[laneIndex], -spec.height, spec.width, spec.height, CONFIG.PALETTE.SOFT_BROWN)
      .setStrokeStyle(2, CONFIG.PALETTE.CREAM);

    this.vehicles.push(vehicle);
    this.vehicleSpeeds.push(Math.max(0.8, spec.speed));
  }

  private createSpawnSpec(phase: TrafficPhase): { width: number; height: number; speed: number } {
    const width = CONFIG.LANE_WIDTH * Phaser.Math.FloatBetween(0.5, 0.68);
    const height = Phaser.Math.Between(70, 95);
    const variance = Phaser.Math.FloatBetween(-phase.speedVariance, phase.speedVariance);
    // Keep vehicles slower than the road pace so the player can settle into draft zones.
    const speed = CONFIG.VEHICLE_BASE_SPEED * (1 + variance);
    return { width, height, speed };
  }

  private getLaneIndexForX(x: number): number {
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < this.laneCenters.length; i += 1) {
      const distance = Math.abs(x - this.laneCenters[i]);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
    return bestDistance <= CONFIG.LANE_WIDTH * 0.45 ? bestIndex : -1;
  }

  private getVehicleSpeed(vehicle: Phaser.GameObjects.Rectangle): number {
    const idx = this.vehicles.indexOf(vehicle);
    if (idx < 0) {
      return CONFIG.VEHICLE_BASE_SPEED;
    }
    return this.vehicleSpeeds[idx];
  }
}
