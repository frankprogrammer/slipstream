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
  // TODO: Implement
}
