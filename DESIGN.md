<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Slipstream — Game Design Document</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&display=swap');

:root {
  --bg: #0c0a0f;
  --surface: #151219;
  --surface-2: #1c1822;
  --amber: #f5a623;
  --amber-dim: #c78418;
  --peach: #e8956a;
  --coral: #d4766a;
  --cream: #fff8f0;
  --cream-dim: #c9bfb3;
  --speed-blue: #4a9eff;
  --accent-green: #7ecf8a;
  --danger: #e85454;
  --font-display: 'Dela Gothic One', sans-serif;
  --font-body: 'DM Sans', sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: var(--bg);
  color: var(--cream);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.7;
  overflow-x: hidden;
}

/* ── HEADER ── */
.hero {
  position: relative;
  padding: 80px 40px 60px;
  text-align: center;
  overflow: hidden;
}
.hero::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -20%;
  width: 140%;
  height: 200%;
  background: radial-gradient(ellipse at 50% 30%, rgba(245,166,35,0.08) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 70%, rgba(74,158,255,0.05) 0%, transparent 50%);
  pointer-events: none;
}
.hero h1 {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  letter-spacing: 2px;
  background: linear-gradient(135deg, var(--amber), var(--peach), var(--coral));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
}
.hero .subtitle {
  font-size: 1.1rem;
  color: var(--cream-dim);
  margin-top: 12px;
  font-weight: 400;
}
.hero .meta {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 28px;
  flex-wrap: wrap;
}
.hero .meta span {
  font-size: 0.85rem;
  color: var(--cream-dim);
  padding: 6px 16px;
  border: 1px solid rgba(255,248,240,0.1);
  border-radius: 100px;
}

/* ── LAYOUT ── */
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 32px 80px;
}

/* ── SECTIONS ── */
section {
  margin-top: 64px;
}
section h2 {
  font-family: var(--font-display);
  font-size: 1.6rem;
  color: var(--amber);
  margin-bottom: 24px;
  position: relative;
  padding-left: 20px;
}
section h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  width: 6px;
  height: 100%;
  background: linear-gradient(180deg, var(--amber), var(--peach));
  border-radius: 3px;
}
section h3 {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--peach);
  margin: 32px 0 12px;
}

p { margin-bottom: 16px; }

/* ── CALLOUT BOXES ── */
.callout {
  background: var(--surface);
  border-left: 4px solid var(--amber);
  padding: 20px 24px;
  border-radius: 0 12px 12px 0;
  margin: 24px 0;
}
.callout.blue { border-left-color: var(--speed-blue); }
.callout.green { border-left-color: var(--accent-green); }
.callout.red { border-left-color: var(--danger); }
.callout strong { color: var(--amber); }
.callout.blue strong { color: var(--speed-blue); }
.callout.green strong { color: var(--accent-green); }
.callout.red strong { color: var(--danger); }

/* ── REFERENCE GRID ── */
.ref-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin: 24px 0;
}
.ref-card {
  background: var(--surface);
  border: 1px solid rgba(255,248,240,0.06);
  border-radius: 12px;
  padding: 20px;
  transition: border-color 0.3s;
}
.ref-card:hover { border-color: var(--amber-dim); }
.ref-card .name {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--cream);
  margin-bottom: 6px;
}
.ref-card .platform {
  font-size: 0.75rem;
  color: var(--amber);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
}
.ref-card .why {
  font-size: 0.9rem;
  color: var(--cream-dim);
  line-height: 1.6;
}

/* ── FLOW DIAGRAM ── */
.flow {
  display: flex;
  align-items: center;
  gap: 0;
  margin: 32px 0;
  flex-wrap: wrap;
  justify-content: center;
}
.flow-step {
  background: var(--surface);
  border: 1px solid rgba(245,166,35,0.2);
  border-radius: 12px;
  padding: 16px 20px;
  text-align: center;
  min-width: 140px;
}
.flow-step .label {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--amber);
  margin-bottom: 4px;
}
.flow-step .desc {
  font-size: 0.8rem;
  color: var(--cream-dim);
}
.flow-arrow {
  color: var(--amber-dim);
  font-size: 1.4rem;
  padding: 0 8px;
}

/* ── STATE TABLE ── */
.state-table {
  width: 100%;
  border-collapse: collapse;
  margin: 24px 0;
  font-size: 0.9rem;
}
.state-table th {
  text-align: left;
  padding: 12px 16px;
  background: var(--surface);
  color: var(--amber);
  font-family: var(--font-display);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 2px solid rgba(245,166,35,0.2);
}
.state-table td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,248,240,0.05);
  color: var(--cream-dim);
  vertical-align: top;
}
.state-table tr:hover td { background: rgba(245,166,35,0.03); }

/* ── TAGS ── */
.tag {
  display: inline-block;
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 100px;
  margin: 2px 4px 2px 0;
  font-weight: 500;
}
.tag.amber { background: rgba(245,166,35,0.15); color: var(--amber); }
.tag.blue { background: rgba(74,158,255,0.15); color: var(--speed-blue); }
.tag.green { background: rgba(126,207,138,0.15); color: var(--accent-green); }
.tag.red { background: rgba(232,84,84,0.15); color: var(--danger); }

/* ── TEMPLATE SECTION ── */
.template-layers {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 24px 0;
}
.layer-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255,248,240,0.06);
}
.layer-card .layer-label {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--speed-blue);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.layer-card ul {
  list-style: none;
  padding: 0;
}
.layer-card li {
  font-size: 0.9rem;
  color: var(--cream-dim);
  padding: 4px 0;
  padding-left: 16px;
  position: relative;
}
.layer-card li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: var(--amber-dim);
}

/* ── DIVIDER ── */
.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(245,166,35,0.2), transparent);
  margin: 48px 0;
}

/* ── RESPONSIVE ── */
@media (max-width: 600px) {
  .hero { padding: 48px 20px 40px; }
  .container { padding: 0 20px 60px; }
  .hero .meta { gap: 12px; }
  .template-layers { grid-template-columns: 1fr; }
  .flow-step { min-width: 100px; padding: 12px 14px; }
}
</style>
</head>
<body>

<div class="hero">
  <h1>SLIPSTREAM</h1>
  <p class="subtitle">A flow-state endless racer where you chain slipstreams behind vehicles to build speed</p>
  <div class="meta">
    <span>Category C5</span>
    <span>Portrait · Mobile-First</span>
    <span>30s – 5min Sessions</span>
    <span>Template-Ready</span>
  </div>
</div>

<div class="container">

  <!-- ══════════ REFERENCE GAMES ══════════ -->
  <section>
    <h2>Reference Games to Study</h2>
    <p>Each of these games has a mechanic or feel that directly maps to what Slipstream needs. Play them with a designer's eye — focus on what makes the first 10 seconds feel good.</p>

    <div class="ref-grid">
      <div class="ref-card">
        <div class="name">Traffic Rider</div>
        <div class="platform">iOS / Android — Free</div>
        <div class="why"><strong>Study for:</strong> The feel of weaving through traffic at speed in first/third person. Note how overtaking close to cars rewards bonus points — this is your near-miss/slipstream zone. Pay attention to how traffic density scales and the satisfying sense of speed from parallax and sound design.</div>
      </div>
      <div class="ref-card">
        <div class="name">Sling Drift</div>
        <div class="platform">iOS / Android — Free</div>
        <div class="why"><strong>Study for:</strong> Single-mechanic endless gameplay that's instantly understood. One tap controls an entire game. Note how "perfect drift" chains create a flow state. Your slipstream chain should feel this satisfying to maintain. Also study how they made a reskinnable template — minimalist art that swaps easily.</div>
      </div>
      <div class="ref-card">
        <div class="name">Alto's Odyssey</div>
        <div class="platform">iOS / Android — Premium</div>
        <div class="why"><strong>Study for:</strong> The "vibe" layer. Alto proves an endless runner can be beautiful and meditative, not just frantic. Study their parallax scrolling, color palette shifts over distance, and how the soundtrack evolves with gameplay. Your sunset-to-starlight sky shift should feel this organic.</div>
      </div>
      <div class="ref-card">
        <div class="name">Subway Surfers</div>
        <div class="platform">iOS / Android — Free</div>
        <div class="why"><strong>Study for:</strong> Lane-switching feel on mobile. The swipe-to-change-lanes mechanic is the gold standard. Note the generous input windows, the satisfying snap between lanes, and how obstacles telegraph early enough to react. Your lane-switch needs to feel this crisp.</div>
      </div>
      <div class="ref-card">
        <div class="name">Overtake 3D</div>
        <div class="platform">iOS / Android — Free</div>
        <div class="why"><strong>Study for:</strong> Traffic overtaking as the core loop. This is the closest direct comp to Slipstream's concept. Note how close passes feel dangerous and rewarding. Study what works and what feels frustrating — Slipstream should take the thrill and cut the unfair deaths.</div>
      </div>
      <div class="ref-card">
        <div class="name">Temple Run</div>
        <div class="platform">iOS / Android — Free</div>
        <div class="why"><strong>Study for:</strong> The "one-more-run" compulsion loop. Instant restart, escalating difficulty, high-score chasing. Also study how they teach the mechanic in 3 seconds with no tutorial screen — the first hallway IS the tutorial. Slipstream should teach slipstreaming the same way.</div>
      </div>
    </div>
  </section>

  <div class="divider"></div>

  <!-- ══════════ CORE GAME LOOP ══════════ -->
  <section>
    <h2>Core Game Loop — 10-Second Cycle</h2>
    <p>Everything in Slipstream revolves around one repeating loop. A player should internalize this within their first 15 seconds of play without reading a single word of instruction.</p>

    <div class="flow">
      <div class="flow-step">
        <div class="label">Approach</div>
        <div class="desc">See a vehicle ahead in traffic</div>
      </div>
      <div class="flow-arrow">→</div>
      <div class="flow-step">
        <div class="label">Align</div>
        <div class="desc">Swipe to tuck in directly behind it</div>
      </div>
      <div class="flow-arrow">→</div>
      <div class="flow-step">
        <div class="label">Draft</div>
        <div class="desc">Speed lines appear, speed builds, chain counter ticks up</div>
      </div>
      <div class="flow-arrow">→</div>
      <div class="flow-step">
        <div class="label">Release</div>
        <div class="desc">Slingshot past, look for next vehicle</div>
      </div>
    </div>

    <div class="callout">
      <strong>The Chain is the Game.</strong> Each consecutive slipstream without crashing increases your chain multiplier (×2, ×3, ×4…). The chain multiplies your score per meter. Breaking the chain (hitting a vehicle, drifting too far from traffic) resets the multiplier to ×1. A 10-chain run at top speed generates an exponentially higher score than 10 separate slipstreams — rewarding sustained skill, not just survival.
    </div>
  </section>

  <div class="divider"></div>

  <!-- ══════════ DETAILED MECHANICS ══════════ -->
  <section>
    <h2>Detailed Mechanics</h2>

    <h3>Controls — One Input, Three Behaviors</h3>
    <p>The player swipes left or right to change lanes. That's the only input. But the context of when you swipe creates three distinct behaviors:</p>

    <table class="state-table">
      <tr>
        <th>Context</th>
        <th>Swipe Does</th>
        <th>Feel</th>
      </tr>
      <tr>
        <td>Open road (no vehicle nearby)</td>
        <td>Standard lane change — smooth, moderate speed</td>
        <td>Calm, scanning</td>
      </tr>
      <tr>
        <td>Approaching a vehicle from behind</td>
        <td>Tuck into slipstream zone — speed lines appear, a "lock on" chime sounds</td>
        <td>Anticipation, precision</td>
      </tr>
      <tr>
        <td>In active slipstream</td>
        <td>Slingshot release — burst of speed as you overtake and look for next target</td>
        <td>Exhilaration, momentum</td>
      </tr>
    </table>

    <h3>The Slipstream Zone</h3>
    <p>A rectangular area directly behind each vehicle (roughly 1.5 car-lengths deep, 1 lane wide). When the player enters this zone:</p>
    <div class="callout blue">
      <strong>Visual:</strong> Speed lines stream from the edges of the screen. The vehicle ahead gets a subtle amber glow outline. A draft meter fills at the top of the HUD.<br><br>
      <strong>Audio:</strong> Wind noise shifts from broad to tunneled. A rising tonal hum builds while drafting. The longer you hold, the higher the pitch — this audio cue tells skilled players when to release without looking at the UI.<br><br>
      <strong>Haptic:</strong> Gentle sustained vibration that intensifies as the draft meter fills. Sharp pulse on release (slingshot moment).
    </div>

    <h3>Traffic Density Scaling</h3>
    <p>Traffic behavior is the primary difficulty lever. Everything is predictable and learnable — no random unfair deaths.</p>

    <table class="state-table">
      <tr>
        <th>Phase</th>
        <th>Time</th>
        <th>Traffic Behavior</th>
        <th>Lanes</th>
      </tr>
      <tr>
        <td><span class="tag amber">Warm-up</span></td>
        <td>0 – 20s</td>
        <td>Sparse, single-file vehicles, wide gaps between them. Teaches the player to approach and draft naturally.</td>
        <td>3 lanes, vehicles in center lane only</td>
      </tr>
      <tr>
        <td><span class="tag blue">Flow</span></td>
        <td>20 – 60s</td>
        <td>Moderate density. Vehicles in all 3 lanes. Gaps are comfortable but require lane-switching between drafts. Clusters of 2–3 vehicles appear.</td>
        <td>3 lanes, all active</td>
      </tr>
      <tr>
        <td><span class="tag green">Rush</span></td>
        <td>60 – 120s</td>
        <td>High density. Tight clusters with narrow gaps. Some vehicles change lanes (telegraphed with blinker signal 1.5s ahead). Chain opportunities are rich but risky.</td>
        <td>3 lanes, vehicles may shift</td>
      </tr>
      <tr>
        <td><span class="tag red">Frenzy</span></td>
        <td>120s+</td>
        <td>Maximum density. Near-constant traffic with slipstream targets everywhere. The challenge shifts from finding targets to choosing the right ones. Vehicle speed variance increases — slow trucks, fast cars.</td>
        <td>3 lanes, high variance</td>
      </tr>
    </table>

    <h3>Scoring</h3>
    <p>Three score sources, all feeding one number:</p>
    <div class="callout green">
      <strong>Distance:</strong> 1 point per meter. Always ticking. This is the baseline.<br><br>
      <strong>Slipstream Bonus:</strong> +50 points per completed draft (approach → lock → release). Modified by chain multiplier.<br><br>
      <strong>Perfect Chain Bonus:</strong> At chain milestones (×5, ×10, ×15, ×20) a burst of bonus points + a visual celebration. ×10 is the "highlight reel" moment — screen flashes gold, coins fly, the word "PERFECT" appears. This is the clip people will record.
    </div>

    <h3>What Ends a Run</h3>
    <p>Only one thing: colliding with a vehicle. There are no other death conditions. No timer, no edge-of-road kill, no health bar. You crash, you're done. The game over screen appears instantly — no delay, no animation that wastes time before you can tap "retry." The restart must be under 1 second.</p>
  </section>

  <div class="divider"></div>

  <!-- ══════════ SCREEN STATES ══════════ -->
  <section>
    <h2>Screen States (MVP = 2 Screens)</h2>

    <table class="state-table">
      <tr>
        <th>Screen</th>
        <th>Elements</th>
        <th>Notes</th>
      </tr>
      <tr>
        <td><strong>Gameplay</strong></td>
        <td>Road (scrolling, 3 lanes) · Vehicles · Player vehicle · HUD: score (top-center), chain multiplier (below score), draft meter (small arc near player)</td>
        <td>Absolutely minimal HUD. Score and chain are the only persistent UI. Draft meter only appears when near a vehicle. No pause button in v1 — tap anywhere except swipe = nothing.</td>
      </tr>
      <tr>
        <td><strong>Game Over</strong></td>
        <td>Final score · Best chain length · Distance · "Best Run" comparison · Retry button (giant, center screen) · Share button</td>
        <td>The share card shows: your vehicle on the road, your final chain count in big text, and the sky gradient from your run. Auto-generates a unique warm-toned gradient per run based on distance reached.</td>
      </tr>
    </table>
  </section>

  <div class="divider"></div>

  <!-- ══════════ FEEL & JUICE ══════════ -->
  <section>
    <h2>Feel & Juice — The Non-Negotiables</h2>
    <p>These details are what separate a forgettable runner from a "one-more-run" addiction. None of these are optional for Slipstream to work.</p>

    <h3>Speed Feel</h3>
    <p>The player's vehicle doesn't actually accelerate much. The illusion of speed comes from: road line scroll speed, parallax layer separation (sky moves slow, road moves fast, roadside objects move fastest), screen shake on slingshot release (tiny, 2-frame), and FOV-like widening when at high chain (subtle zoom-out of 3–5%).</p>

    <h3>Audio Design</h3>
    <p>Sound does more work than visuals for speed feel. The engine hum should be a warm low-frequency tone, not a harsh rev. Wind noise layers on at speed. The slipstream "lock-on" should be a deeply satisfying tonal shift — like sliding into a groove. The slingshot release needs a punchy "whoosh + chime" that players will associate with dopamine within 3 runs. Chain milestone sounds should escalate: ×5 is a ding, ×10 is a full chord, ×15 is a cascading arpeggio, ×20 is euphoric.</p>

    <h3>Visual Juice Checklist</h3>
    <div class="callout">
      <strong>Speed lines:</strong> Emanate from screen edges during slipstream. Opacity and density scale with chain length.<br><br>
      <strong>Draft glow:</strong> The vehicle you're drafting behind gets a warm amber outline that pulses with the audio tone.<br><br>
      <strong>Slingshot burst:</strong> On release, a brief radial blur + coin-particle explosion from the point of release.<br><br>
      <strong>Chain counter pop:</strong> Each increment of the chain counter pops with a scale animation (1.3x → 1.0x over 200ms).<br><br>
      <strong>Sky gradient shift:</strong> Starts warm amber, shifts through peach, coral, and into twilight purple as the run progresses. This happens slowly enough that the player doesn't notice until they look up and realize the sky has changed. Ties into the "cozy nostalgia" art direction.<br><br>
      <strong>Screen flash on milestone:</strong> At ×10, the entire screen briefly tints gold (100ms). This is THE moment players will clip.
    </div>
  </section>

  <div class="divider"></div>

  <!-- ══════════ TEMPLATE ARCHITECTURE ══════════ -->
  <section>
    <h2>Template Architecture — Reskinning Guide</h2>
    <p>Slipstream should be built so that another developer can reskin it to a completely different theme in under a day. This means separating the game into clear layers:</p>

    <div class="template-layers">
      <div class="layer-card">
        <div class="layer-label">Engine Layer (Never Changes)</div>
        <ul>
          <li>Lane-switching input system (3-lane swipe)</li>
          <li>Slipstream zone detection (hitbox behind vehicles)</li>
          <li>Chain multiplier math</li>
          <li>Traffic spawning + density scaling</li>
          <li>Collision detection</li>
          <li>Score calculation</li>
          <li>Game state machine (play → game over → retry)</li>
          <li>Parallax scroll system</li>
        </ul>
      </div>
      <div class="layer-card">
        <div class="layer-label">Skin Layer (Swap Everything)</div>
        <ul>
          <li>Player vehicle sprite/model</li>
          <li>Traffic vehicle sprites/models (2 types min)</li>
          <li>Road/ground texture</li>
          <li>Parallax background layers (sky, midground, roadside)</li>
          <li>Color palette (CSS variables or config)</li>
          <li>Sound effects (engine, wind, lock-on, release, crash)</li>
          <li>Music track</li>
          <li>UI fonts and button styles</li>
        </ul>
      </div>
      <div class="layer-card">
        <div class="layer-label">Config Layer (Tune Per Skin)</div>
        <ul>
          <li>Base scroll speed</li>
          <li>Speed multiplier curve</li>
          <li>Traffic density curve (time → spawn rate)</li>
          <li>Slipstream zone size (width, depth)</li>
          <li>Draft meter fill rate</li>
          <li>Chain milestone thresholds</li>
          <li>Lane count (default 3, could be 2 or 4)</li>
          <li>Vehicle speed variance range</li>
        </ul>
      </div>
      <div class="layer-card">
        <div class="layer-label">Reskin Examples</div>
        <ul>
          <li><strong>Space Highway:</strong> Spaceship drafting behind cargo freighters on a neon corridor</li>
          <li><strong>River Rapids:</strong> Kayak drafting behind logs in a flowing river</li>
          <li><strong>Ski Slope:</strong> Skier tucking behind other racers on a downhill course</li>
          <li><strong>Ocean Current:</strong> Fish swimming in the draft of larger sea creatures</li>
          <li><strong>City Cyclist:</strong> Bike messenger drafting behind buses and taxis</li>
        </ul>
      </div>
    </div>

    <div class="callout blue">
      <strong>Implementation Tip:</strong> Build the engine layer as a single class/module with a config object passed in. The skin layer should be a folder of assets + a theme config file. Swapping skins = swapping the folder reference + config. No engine code should reference specific asset names — everything through the config.
    </div>
  </section>

  <div class="divider"></div>

  <!-- ══════════ SCOPE CUTS ══════════ -->
  <section>
    <h2>Scope Cuts — What's NOT in V1</h2>
    <p>Keeping this list visible ensures nobody scope-creeps during development.</p>

    <table class="state-table">
      <tr>
        <th>Feature</th>
        <th>Why It Was Cut</th>
        <th>Revisit?</th>
      </tr>
      <tr>
        <td>Jumps / ramps</td>
        <td>Breaks the slipstream chain flow. The game is about horizontal precision, not vertical action.</td>
        <td><span class="tag red">No</span></td>
      </tr>
      <tr>
        <td>Speed boosts / power-ups</td>
        <td>The slipstream IS the boost. Adding pickups dilutes the core loop and adds UI clutter.</td>
        <td><span class="tag red">No</span></td>
      </tr>
      <tr>
        <td>Vehicle upgrades</td>
        <td>Skill-only progression. Upgrades create pay-to-win pressure and complicate the template system.</td>
        <td><span class="tag red">No</span></td>
      </tr>
      <tr>
        <td>Multiple vehicle choices</td>
        <td>One vehicle. No selection screen. Reduces time-to-play to zero. Skins swap the vehicle globally.</td>
        <td><span class="tag amber">V2 — cosmetic only</span></td>
      </tr>
      <tr>
        <td>Leaderboard</td>
        <td>Adds server infrastructure. V1 is local high score only.</td>
        <td><span class="tag green">V2</span></td>
      </tr>
      <tr>
        <td>Coins / currency</td>
        <td>No economy in v1. Score is the only number. Keeps the template clean.</td>
        <td><span class="tag amber">V2 — if needed for monetization</span></td>
      </tr>
      <tr>
        <td>Oncoming traffic (2-way road)</td>
        <td>Adds a collision type that can't be slipstreamed. Breaks the core loop premise.</td>
        <td><span class="tag red">No</span></td>
      </tr>
      <tr>
        <td>Weather / road conditions</td>
        <td>Visual complexity without gameplay depth. The sky gradient shift gives enough visual progression.</td>
        <td><span class="tag amber">V2 — visual only</span></td>
      </tr>
    </table>
  </section>

  <div class="divider"></div>

  <!-- ══════════ SESSION FLOW ══════════ -->
  <section>
    <h2>Session Flow — What 3 Minutes Looks Like</h2>

    <table class="state-table">
      <tr>
        <th>Time</th>
        <th>What's Happening</th>
        <th>Player Feeling</th>
      </tr>
      <tr>
        <td>0:00</td>
        <td>Tap to start. Vehicle is already moving. First car appears ahead in center lane.</td>
        <td>Immediate engagement. No loading, no countdown.</td>
      </tr>
      <tr>
        <td>0:05</td>
        <td>Player swipes behind first car. Speed lines appear. "Ohh, that's what this does."</td>
        <td>Discovery. The mechanic teaches itself.</td>
      </tr>
      <tr>
        <td>0:10</td>
        <td>First slingshot release. Speed burst. Chain: ×1. Second car ahead.</td>
        <td>First hit of dopamine. "I want to do that again."</td>
      </tr>
      <tr>
        <td>0:20</td>
        <td>Traffic picks up. Player chains 3 slipstreams. Chain: ×3. Score climbing fast.</td>
        <td>Flow state beginning. Reading traffic patterns.</td>
      </tr>
      <tr>
        <td>0:45</td>
        <td>Rush phase. Dense clusters. Chain hits ×5 — first milestone ding.</td>
        <td>Pride. Tension. "Don't break it."</td>
      </tr>
      <tr>
        <td>1:15</td>
        <td>Vehicles shifting lanes. Player threading between trucks. Chain: ×8.</td>
        <td>Full focus. The sky has shifted to peach and they haven't noticed yet.</td>
      </tr>
      <tr>
        <td>1:45</td>
        <td>Chain hits ×10. Gold flash. "PERFECT" text. Score explodes.</td>
        <td>Euphoria. This is the clip moment.</td>
      </tr>
      <tr>
        <td>2:20</td>
        <td>Frenzy phase. Traffic everywhere. Player pushes for ×15. Clip a truck's bumper — crash.</td>
        <td>Heartbreak → instant "Retry" tap.</td>
      </tr>
      <tr>
        <td>2:22</td>
        <td>New run. Already moving.</td>
        <td>"I can do better."</td>
      </tr>
    </table>
  </section>

  <div class="divider"></div>

  <!-- ══════════ COZY NOSTALGIA FIT ══════════ -->
  <section>
    <h2>Cozy Nostalgia Art Direction — How It Fits</h2>
    <p>Slipstream is the "fastest" game in the suite, but it should still feel warm, not aggressive. Here's how the cozy nostalgia direction applies:</p>

    <div class="callout">
      <strong>Setting:</strong> A countryside highway at golden hour. Rolling hills, small farmhouses, windmills, and wildflower fields scroll by as parallax layers. Not a cold highway — a warm, inviting road that feels like a Sunday drive that got exciting.<br><br>
      <strong>Vehicles:</strong> Rounded, friendly shapes. Think vintage VW vans, old pickup trucks, cozy delivery bikes. No aggressive sports cars or trucks. Even the obstacles feel like characters.<br><br>
      <strong>Palette:</strong> Amber road markings, peach sky, coral vehicle accents, cream road surface. Shadows are warm brown, never gray. As the run progresses, the palette shifts through dusty rose into twilight lavender — but always warm.<br><br>
      <strong>Audio:</strong> Lo-fi acoustic base layer (soft guitar or ukulele). The engine sound is a gentle hum, not a roar. Wind sounds warm, not harsh. The slingshot release chime should use the same chime family as the other four games.<br><br>
      <strong>Ember Cameo:</strong> Ember rides the player's vehicle (sitting on the handlebars of a scooter, or peering out the window of a little car). Keeps the mascot presence consistent across the suite.
    </div>
  </section>

</div>
</body>
</html>