# CLAUDE.md — Slipstream Game Project

## What This Is
Slipstream is a portrait-orientation mobile-first 2D endless runner built with **Phaser 3** and **TypeScript**. The player chains slipstreams behind traffic vehicles to build a speed/score multiplier. It's designed as a **snackable game** (30s–5min sessions) for Instagram Reels distribution.

Read `DESIGN.md` for the full game design document. **All gameplay decisions should reference it.**

---

## Architecture — Three Layers (Strictly Enforced)

The game MUST be structured into three cleanly separated layers so it can be reskinned by swapping assets and config without touching engine code.

### 1. Engine Layer (`src/engine/`)
Core game logic. **Never references specific asset filenames.** Everything goes through config and the skin manifest.

- `LaneSystem.ts` — 3-lane grid, swipe/keyboard input, lane-switch tweens
- `SlipstreamZone.ts` — Rectangular hitbox behind each vehicle, draft detection, meter fill logic
- `ChainManager.ts` — Chain multiplier tracking, milestone events (×5, ×10, ×15, ×20), reset conditions
- `TrafficSpawner.ts` — Vehicle spawning with density phases (warm-up → flow → rush → frenzy), lane assignment, speed variance
- `ScrollManager.ts` — Parallax scrolling system with configurable layer speeds
- `ScoreManager.ts` — Distance scoring, slipstream bonuses, chain multiplier math
- `CollisionSystem.ts` — Player vs vehicle collision, game-over trigger

### 2. Skin Layer (`src/skins/default/`)
All visual and audio assets for one theme. Swapping this folder + its manifest = a new game skin.

- `manifest.ts` — Asset keys, file paths, color palette (CSS hex values), font names
- `sprites/` — Player vehicle, traffic vehicles (2 types minimum), road markings, particle textures
- `audio/` — Engine hum, wind loop, draft lock-on, slingshot release, crash, chain milestone sounds (×5, ×10, ×15, ×20)

### 3. Config Layer (`src/config.ts`)
All tunable gameplay values in one file. Designers should be able to change the game's feel by editing ONLY this file.

```typescript
export const CONFIG = {
  // Canvas
  GAME_WIDTH: 390,
  GAME_HEIGHT: 844,

  // Lanes
  LANE_COUNT: 3,
  LANE_WIDTH: 100, // pixels
  LANE_SWITCH_DURATION: 150, // ms

  // Scrolling
  BASE_SCROLL_SPEED: 3, // pixels per frame
  MAX_SCROLL_SPEED: 8,
  PARALLAX_SPEEDS: [0.2, 0.5, 1.0], // sky, midground, road

  // Slipstream
  SLIPSTREAM_ZONE_WIDTH: 80, // pixels
  SLIPSTREAM_ZONE_DEPTH: 120, // pixels behind vehicle
  DRAFT_FILL_RATE: 0.02, // per frame (fills in ~1.5s at 60fps)
  SLINGSHOT_SPEED_BURST: 2.0, // added to scroll speed temporarily
  SLINGSHOT_BURST_DURATION: 500, // ms

  // Chain
  CHAIN_TIMEOUT: 3000, // ms without drafting before chain resets
  CHAIN_MILESTONES: [5, 10, 15, 20],
  CHAIN_SCORE_BASE: 50, // points per completed draft

  // Traffic density phases
  TRAFFIC_PHASES: [
    { startTime: 0, spawnRate: 2000, lanes: [1], speedVariance: 0 },
    { startTime: 20000, spawnRate: 1200, lanes: [0,1,2], speedVariance: 0.2 },
    { startTime: 60000, spawnRate: 800, lanes: [0,1,2], speedVariance: 0.4, laneChange: true },
    { startTime: 120000, spawnRate: 500, lanes: [0,1,2], speedVariance: 0.6, laneChange: true },
  ],

  // Vehicle types
  VEHICLE_TYPES: 2,
  VEHICLE_LANE_CHANGE_TELEGRAPH: 1500, // ms blinker before lane change

  // Scoring
  DISTANCE_SCORE_RATE: 1, // points per 10 pixels scrolled

  // Visual juice
  SKY_GRADIENT_COLORS: ['#D4762C', '#E8956A', '#D4836A', '#9B6B8A', '#5C4B7A'],
  SCREEN_FLASH_DURATION: 100, // ms
  CHAIN_POP_SCALE: 1.3,
  CHAIN_POP_DURATION: 200, // ms
};
```

---

## Phaser Scenes (2 only)

### GameScene (`src/scenes/GameScene.ts`)
- Single screen: 3-lane road scrolling downward, player vehicle bottom-center
- Traffic vehicles spawn above screen, scroll down
- HUD elements: score (top center), chain multiplier (below score), draft meter (arc near player, only visible during draft)
- Parallax background: 3 layers (sky, midground, road lines)
- Touch input: swipe left/right to change lanes. Also support keyboard arrows for desktop testing.

### GameOverScene (`src/scenes/GameOverScene.ts`)
- Displays: final score, best chain length, distance traveled, personal best comparison
- Retry button: large, center screen, one tap to restart (restart MUST be under 1 second)
- Share button: generates a result card image

---

## Core Mechanic — The 10-Second Loop

```
APPROACH vehicle → SWIPE to align behind it → DRAFT (speed lines, meter fills) → RELEASE (slingshot burst, chain +1) → repeat
```

### Slipstream Activation
When player overlaps a vehicle's slipstream zone:
1. Speed lines particle emitter activates from screen edges
2. Target vehicle gets amber glow outline
3. Draft meter begins filling
4. Audio: wind shifts to tunneled, rising tonal hum

### Slingshot Release
When player swipes OUT of draft zone OR draft meter fills completely:
1. Speed burst (configurable duration)
2. Chain counter increments with pop tween
3. Score bonus: `CHAIN_SCORE_BASE × current_chain_multiplier`
4. Radial blur tween + particle burst
5. Audio: punchy whoosh + chime

### Chain Rules
- Chain increments on each completed draft→release
- Chain resets if: player collides with vehicle, OR `CHAIN_TIMEOUT` ms pass without entering any slipstream zone
- Milestones at ×5, ×10, ×15, ×20 trigger celebrations
- ×10 milestone: full gold screen flash (THE clip moment)

### Death
- ONLY trigger: collision with a vehicle
- Instant transition to GameOverScene (no death animation delay)
- No other death conditions (no edge-of-road, no timer, no health)

---

## Visual Juice Checklist (All Required)

- [ ] **Speed lines**: Particle emitter from screen edges during draft. Opacity/density scales with chain length.
- [ ] **Draft glow**: Amber outline on drafted vehicle, pulses with audio.
- [ ] **Slingshot burst**: Radial blur tween + coin-particle explosion on release.
- [ ] **Chain counter pop**: Scale tween 1.3x → 1.0x over 200ms on each increment.
- [ ] **Sky gradient shift**: Background lerps through warm amber → peach → coral → twilight purple based on distance.
- [ ] **Screen flash**: Gold tint overlay at 100ms on ×10 milestone.
- [ ] **Parallax scrolling**: 3 layers at different speeds. Sky barely moves, road lines move fast.
- [ ] **Lane-switch snap**: Quick, satisfying tween with slight overshoot easing.

---

## Art Direction — Cozy Nostalgia

This game is part of a 5-game suite sharing one art direction:

- **Palette**: Warm sunset tones — amber (#D4762C), peach (#E8956A), coral (#D4836A), cream (#FFF8F0). Shadows use warm brown (#4A3F35), never cool gray or black.
- **Vehicles**: Rounded, friendly shapes. Vintage VW vans, old pickup trucks, cozy delivery bikes. NOT aggressive sports cars.
- **Setting**: Countryside highway at golden hour. Rolling hills, farmhouses, windmills, wildflower fields as parallax layers.
- **Character style**: Rounded flat vector (Untitled Goose Game / Pikuniku vibe).
- **Mascot**: Ember (small round creature) rides the player vehicle as a cameo.
- **Audio**: Lo-fi acoustic base. Engine = gentle hum, not a roar. Wind sounds warm. Slingshot chime should feel cozy, not aggressive.

---

## Scope — What Is NOT in V1

Do NOT implement any of these:
- Jumps, ramps, or boosts
- Vehicle upgrades or unlock system
- Multiple vehicle selection
- Coins or currency
- Oncoming traffic (two-way road)
- Weather or road condition effects
- Pause button
- Tutorial screen (the warm-up phase IS the tutorial)
- Power-ups of any kind
- Leaderboard (local high score only)

---

## Tech Stack

- **Framework**: Phaser 3 (latest stable)
- **Language**: TypeScript
- **Bundler**: Vite
- **Target**: Mobile web (portrait), responsive canvas filling screen
- **Input**: Touch (swipe) primary, keyboard secondary (dev/testing)
- **Deployment**: Web-first, mobile-responsive

---

## File Structure

```
slipstream/
├── CLAUDE.md          ← You are here
├── DESIGN.md          ← Full game design document (HTML)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── public/
│   └── (static assets if needed)
├── src/
│   ├── main.ts                  ← Phaser game config, boot
│   ├── config.ts                ← All tunable values
│   ├── engine/
│   │   ├── LaneSystem.ts
│   │   ├── SlipstreamZone.ts
│   │   ├── ChainManager.ts
│   │   ├── TrafficSpawner.ts
│   │   ├── ScrollManager.ts
│   │   ├── ScoreManager.ts
│   │   └── CollisionSystem.ts
│   ├── scenes/
│   │   ├── GameScene.ts
│   │   └── GameOverScene.ts
│   ├── skins/
│   │   └── default/
│   │       ├── manifest.ts      ← Asset registry + palette
│   │       ├── sprites/
│   │       └── audio/
│   └── ui/
│       ├── HUD.ts               ← Score, chain, draft meter
│       └── ShareCard.ts         ← End-of-run shareable image
```

---

## Development Workflow

1. **Scaffold first**: Get the 3-lane road scrolling with a placeholder rectangle as the player and placeholder rectangles as traffic. No art needed.
2. **Input second**: Get swipe detection and lane-switching feeling crisp.
3. **Slipstream third**: Implement the zone detection, draft meter, and slingshot release. This is the core mechanic — spend the most time here.
4. **Juice fourth**: Speed lines, slingshot burst, chain pop, sky gradient. Layer on one at a time.
5. **Art last**: Replace placeholder rectangles with actual sprites. Apply the cozy nostalgia palette.

**Do NOT skip to art before the mechanic feels good with rectangles.**

---

## Testing Checklist

Before considering the game "done":
- [ ] First moment of fun within 10 seconds of opening
- [ ] A complete novice understands the mechanic without reading anything
- [ ] Chain ×10 feels euphoric (visual + audio + score explosion)
- [ ] Losing a high chain feels heartbreaking (instant motivation to retry)
- [ ] Retry is under 1 second from tap to playing again
- [ ] Runs smoothly at 60fps on a mid-range phone
- [ ] Portrait orientation fills the screen properly on iPhone and Android
- [ ] A 3-minute run feels like 30 seconds (flow state achieved)
