/**
 * SLIPSTREAM — Game Configuration
 *
 * All tunable gameplay values in one file.
 * Designers can change the game's feel by editing ONLY this file.
 * Engine code should never hardcode any of these values.
 */

export interface TrafficPhase {
  startTime: number; // ms from run start
  spawnRate: number; // ms between vehicle spawns
  lanes: number[]; // which lanes can spawn vehicles (0=left, 1=center, 2=right)
  speedVariance: number; // 0–1, how much vehicle speed can vary from base
  laneChange?: boolean; // can vehicles change lanes in this phase?
}

export const CONFIG = {
  // ── Canvas (portrait 9 : 19.5 — common phone proportion) ──
  GAME_WIDTH: 390,
  GAME_HEIGHT: 845, // 390 × (19.5 / 9) → 9 : 19.5 portrait

  // ── Lanes ──
  LANE_COUNT: 3,
  LANE_WIDTH: 100, // pixels per lane
  LANE_SWITCH_DURATION: 150, // ms for lane-switch tween
  LANE_SWITCH_EASE: "Back.easeOut", // slight overshoot for satisfying snap

  // ── Scrolling ──
  BASE_SCROLL_SPEED: 4.25, // pixels per frame at start
  MAX_SCROLL_SPEED: 10, // cap for the ramped base component (bonuses stack on top)
  SPEED_RAMP_RATE: 0.001, // base scroll never decreases; ramps toward MAX_SCROLL_SPEED
  PARALLAX_SPEEDS: [0.2, 0.5, 1.0] as readonly number[], // sky, midground, road

  // ── Slipstream ──
  SLIPSTREAM_ZONE_WIDTH: 80, // pixels wide (centered behind vehicle)
  SLIPSTREAM_ZONE_DEPTH: 120, // pixels below vehicle
  /** Debug slipstream streaks: vertical scroll speed (px/s) inside the zone rect. */
  SLIPSTREAM_DEBUG_STREAK_SCROLL_SPEED: 90,
  /**
   * Each column tiles one repeating sequence: brick → gap → brick → … (variable brick heights OK).
   * Presets cycle by column index; same sequence every loop (deterministic, not noisy).
   */
  SLIPSTREAM_DEBUG_STREAK_COLUMN_PRESETS: [
    {
      segments: [
        { brick: 10, gap: 5 },
        { brick: 18, gap: 5 },
        { brick: 7, gap: 6 },
      ],
    },
    {
      segments: [
        { brick: 22, gap: 4 },
        { brick: 12, gap: 4 },
        { brick: 16, gap: 5 },
      ],
    },
    {
      segments: [
        { brick: 8, gap: 6 },
        { brick: 14, gap: 5 },
        { brick: 11, gap: 7 },
        { brick: 6, gap: 6 },
      ],
    },
    {
      segments: [
        { brick: 16, gap: 5 },
        { brick: 9, gap: 6 },
        { brick: 20, gap: 4 },
      ],
    },
  ] as const,
  /**
   * Draft meter fill per frame at BASE_SCROLL_SPEED (× delta normalization).
   * Actual fill is multiplied by (current scroll step / base scroll step) so faster runs keep similar draft timing.
   */
  DRAFT_FILL_RATE: 0.04,
  /** Added to persistent world speed each time the draft meter fills (not on zone enter). */
  DRAFT_SPEED_BONUS: 0.15,
  /**
   * Caps persistent draft + slingshot stacking (each complete adds DRAFT_SPEED_BONUS + SLINGSHOT_SPEED_BURST).
   */
  DRAFT_SPEED_BONUS_MAX: 32,
  /** Slingshot reward applied permanently on draft complete (no timed speed dip afterward). */
  SLINGSHOT_SPEED_BURST: 2.0,
  /** Reserved for ScrollManager / burst VFX timing (gameplay speed does not use a timed burst). */
  SLINGSHOT_BURST_DURATION: 500,
  /**
   * While in a slipstream zone, extra speed × draft meter (0–1). Ramps up as you draft; no slowdown vs base.
   */
  DRAFT_ZONE_SPEED_MAX: 0.55,

  // ── Chain ──
  CHAIN_TIMEOUT: 3000, // ms without drafting → chain resets
  CHAIN_MILESTONES: [5, 10, 15, 20] as readonly number[],
  CHAIN_SCORE_BASE: 50, // points per draft, multiplied by chain

  // ── Traffic Density Phases ──
  TRAFFIC_PHASES: [
    // Warm-up: sparse, center only, teaches drafting naturally
    {
      startTime: 0,
      spawnRate: 2000,
      lanes: [1],
      speedVariance: 0,
      laneChange: true,
    },
    // Flow: moderate, all lanes, comfortable gaps
    { startTime: 20000, spawnRate: 1200, lanes: [0, 1, 2], speedVariance: 0.2 },
    // Rush: dense clusters, vehicles may change lanes
    {
      startTime: 60000,
      spawnRate: 800,
      lanes: [0, 1, 2],
      speedVariance: 0.4,
      laneChange: true,
    },
    // Frenzy: maximum density, high variance
    {
      startTime: 120000,
      spawnRate: 500,
      lanes: [0, 1, 2],
      speedVariance: 0.6,
      laneChange: true,
    },
  ] as readonly TrafficPhase[],

  // ── Vehicles ──
  VEHICLE_TYPES: 2,
  VEHICLE_LANE_CHANGE_TELEGRAPH: 1500, // ms blinker shown before lane change
  VEHICLE_BASE_SPEED: 1.5, // slower than player's scroll speed (so player approaches them)
  TRAFFIC_ADJACENT_LANE_MIN_GAP_MULTIPLIER: 1.35,

  // ── Scoring ──
  DISTANCE_SCORE_RATE: 1, // points per N pixels scrolled
  DISTANCE_SCORE_INTERVAL: 10, // every N pixels = 1 point

  // ── Visual Juice ──
  SKY_TRANSITION_DISTANCE: 5000, // pixels of distance per color step
  SCREEN_FLASH_DURATION: 100, // ms (gold flash at ×10)
  CHAIN_POP_SCALE: 1.3,
  CHAIN_POP_DURATION: 200, // ms

  // ── Speed Lines Particle Config ──
  SPEED_LINES_BASE_ALPHA: 0.55,
  SPEED_LINES_MAX_ALPHA: 0.95,
  SPEED_LINES_FREQUENCY: 50, // ms between particles
  SPEED_LINES_WIDTH_MIN: 3,
  SPEED_LINES_WIDTH_MAX: 6,
  SPEED_LINES_HEIGHT_MIN: 52,
  SPEED_LINES_HEIGHT_MAX: 100,

  // ── Draft Glow ──
  DRAFT_GLOW_PULSE_SPEED: 800, // ms per pulse cycle

  // ── Player trail ribbon ──
  /** Split long polyline edges so lane-change diagonals are sampled smoothly for the stroke. */
  TRAIL_DENSIFY_MAX_SEGMENT_PX: 12,
  /** Chaikin corner-cutting iterations (more = smoother polyline before stroke). */
  TRAIL_CHAIKIN_ITERATIONS: 2,
  /** Laplacian smooth passes on the centerline (softens sharp bends after densify). */
  TRAIL_LAPLACIAN_SMOOTH_PASSES: 2,
  /** After a lane switch ends, curve blend 1→0 over this duration (stops the trail snapping straight). */
  TRAIL_CURVE_BLEND_DECAY_MS: 2800,
  /** Min ms between trail samples; higher = less moiré / shimmer at high speed (mobile-friendly). */
  TRAIL_SPAWN_INTERVAL_MIN_MS: 8,

  // ── Player ──
  PLAYER_Y_POSITION: 0.8, // fraction of screen height from top (80% down = near bottom)
} as const;
