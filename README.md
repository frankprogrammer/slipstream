# Slipstream

A flow-state endless racer where you chain slipstreams behind vehicles to build speed. Part of the Snackable Games suite.

## Quickstart

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`. Use arrow keys to lane-switch (touch/swipe on mobile).

## Project Structure

```
src/
├── main.ts              # Phaser boot config
├── config.ts            # ALL tunable gameplay values
├── engine/              # Core game logic (never references assets directly)
│   ├── LaneSystem.ts
│   ├── SlipstreamZone.ts
│   ├── ChainManager.ts
│   ├── TrafficSpawner.ts
│   ├── ScrollManager.ts
│   ├── ScoreManager.ts
│   └── CollisionSystem.ts
├── scenes/
│   ├── GameScene.ts     # The one gameplay screen
│   └── GameOverScene.ts # The one game-over screen
├── skins/default/       # All swappable art + audio + palette
│   └── manifest.ts
└── ui/
    ├── HUD.ts           # Score, chain counter, draft meter
    └── ShareCard.ts     # End-of-run shareable image
```

## Key Files for AI Tools

- **CLAUDE.md** — Full project instructions for Claude Code / Cursor. Read this first.
- **DESIGN.md** — Complete game design document with mechanics, feel targets, and art direction.
- **src/config.ts** — Every tunable value. Change the game's feel without touching engine code.
- **src/skins/default/manifest.ts** — Asset registry. Reskin by duplicating and swapping.

## Development Order

1. Scrolling road with placeholder rectangles
2. Lane-switching input (swipe + keyboard)
3. Traffic spawning and scrolling
4. Slipstream zone detection + draft meter
5. Slingshot release + chain multiplier
6. Score + HUD
7. Collision → game over → instant retry
8. Visual juice (speed lines, glow, pop tweens, sky gradient)
9. Replace placeholders with actual art

**Do not skip to art before the mechanic feels good with rectangles.**

## Reskinning

To create a new skin:
1. Duplicate `src/skins/default/`
2. Replace all sprite and audio files
3. Update `manifest.ts` with new paths and palette
4. Point the import in `GameScene.ts` to the new manifest

The engine layer never hardcodes asset names — everything flows through the manifest.
