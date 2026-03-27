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
  // ── Canvas ──
  GAME_WIDTH: 390,
  GAME_HEIGHT: 844,

  // ── Lanes ──
  LANE_COUNT: 3,
  LANE_WIDTH: 100, // pixels per lane
  LANE_SWITCH_DURATION: 150, // ms for lane-switch tween
  LANE_SWITCH_EASE: "Back.easeOut", // slight overshoot for satisfying snap

  // ── Scrolling ──
  BASE_SCROLL_SPEED: 4.25, // pixels per frame at start
  MAX_SCROLL_SPEED: 8, // cap
  SPEED_RAMP_RATE: 0.001, // speed increase per frame (very gradual)
  PARALLAX_SPEEDS: [0.2, 0.5, 1.0] as readonly number[], // sky, midground, road

  // ── Slipstream ──
  SLIPSTREAM_ZONE_WIDTH: 80, // pixels wide (centered behind vehicle)
  SLIPSTREAM_ZONE_DEPTH: 120, // pixels below vehicle
  DRAFT_FILL_RATE: 0.02, // per frame (~1.5s at 60fps to fill)
  SLINGSHOT_SPEED_BURST: 2.0, // added to scroll speed
  SLINGSHOT_BURST_DURATION: 500, // ms

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
  SKY_GRADIENT_COLORS: [
    "#D4762C",
    "#E8956A",
    "#D4836A",
    "#9B6B8A",
    "#5C4B7A",
  ] as readonly string[],
  SKY_TRANSITION_DISTANCE: 5000, // pixels of distance per color step
  SCREEN_FLASH_DURATION: 100, // ms (gold flash at ×10)
  SCREEN_FLASH_COLOR: 0xf5a623,
  CHAIN_POP_SCALE: 1.3,
  CHAIN_POP_DURATION: 200, // ms

  // ── Speed Lines Particle Config ──
  SPEED_LINES_BASE_ALPHA: 0.3,
  SPEED_LINES_MAX_ALPHA: 0.8,
  SPEED_LINES_FREQUENCY: 50, // ms between particles

  // ── Draft Glow ──
  DRAFT_GLOW_COLOR: 0xf5a623, // amber
  DRAFT_GLOW_PULSE_SPEED: 800, // ms per pulse cycle

  // ── Player ──
  PLAYER_Y_POSITION: 0.8, // fraction of screen height from top (80% down = near bottom)

  // ── Swipe Input ──
  SWIPE_THRESHOLD: 30, // minimum pixels for swipe detection
  SWIPE_MAX_TIME: 300, // max ms for a swipe gesture

  // ── Art Direction (Cozy Nostalgia Palette) ──
  PALETTE: {
    AMBER: 0xd4762c,
    PEACH: 0xe8956a,
    CORAL: 0xd4836a,
    CREAM: 0xfff8f0,
    WARM_GRAY: 0x4a3f35,
    SOFT_BROWN: 0x7a6b5d,
    DUSTY_ROSE: 0x9b6b8a,
    TWILIGHT: 0x5c4b7a,
  },
} as const;
