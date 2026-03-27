/**
 * Default Skin Manifest — Cozy Nostalgia theme
 *
 * This file maps abstract asset keys to actual file paths and defines
 * the visual identity of this skin. The engine layer references ONLY
 * the keys defined here — never specific filenames.
 *
 * To reskin the game:
 * 1. Duplicate the `default/` folder
 * 2. Replace all sprite and audio files
 * 3. Update the paths and palette in this manifest
 * 4. Point main.ts to the new manifest
 */
export const SKIN_MANIFEST = {
  name: 'Cozy Nostalgia — Countryside Highway',

  // ── Color Palette ──
  palette: {
    primary: '#D4762C', // amber
    secondary: '#E8956A', // peach
    accent: '#D4836A', // coral
    background: '#FFF8F0', // cream
    shadow: '#4A3F35', // warm gray
    text: '#4A3F35',
    textLight: '#7A6B5D', // soft brown

    // Explicit runtime aliases for engine/scenes.
    amber: '#D4762C',
    peach: '#E8956A',
    coral: '#D4836A',
    cream: '#FFF8F0',
    warmGray: '#4A3F35',
    softBrown: '#7A6B5D',
    dustyRose: '#9B6B8A',
    twilight: '#5C4B7A',
  },

  skyGradient: ['#D4762C', '#E8956A', '#D4836A', '#9B6B8A', '#5C4B7A'],

  // ── Sprite Assets ──
  // For prototype: use null (engine draws placeholder rectangles)
  // For production: point to actual sprite files
  sprites: {
    player: null,            // 'sprites/player-scooter.png'
    vehicleA: null,          // 'sprites/vehicle-van.png' (rounded VW van)
    vehicleB: null,          // 'sprites/vehicle-truck.png' (friendly pickup)
    roadLine: null,          // 'sprites/road-line.png'
    speedLineParticle: null, // 'sprites/speed-line.png'
    coinParticle: null,      // 'sprites/coin-particle.png'
    ember: null,             // 'sprites/ember.png' (mascot cameo on player vehicle)
  },

  // ── Parallax Background Layers ──
  backgrounds: {
    sky: null,               // 'sprites/bg-sky.png' (warm sunset gradient)
    midground: null,         // 'sprites/bg-hills.png' (rolling hills, farmhouses, windmills)
    road: null,              // 'sprites/bg-road.png' (road surface texture)
  },

  // ── Audio Assets ──
  audio: {
    engineHum: null,         // 'audio/engine-hum.ogg' (gentle, warm, not aggressive)
    windLoop: null,          // 'audio/wind-loop.ogg' (warm wind)
    draftLockOn: null,       // 'audio/draft-lock.ogg' (satisfying tonal shift)
    slingshotRelease: null,  // 'audio/slingshot.ogg' (punchy whoosh + chime)
    crash: null,             // 'audio/crash.ogg' (soft thud, not violent)
    milestone5: null,        // 'audio/milestone-ding.ogg'
    milestone10: null,       // 'audio/milestone-chord.ogg' (full warm chord)
    milestone15: null,       // 'audio/milestone-arpeggio.ogg'
    milestone20: null,       // 'audio/milestone-euphoric.ogg'
    bgMusic: null,           // 'audio/bg-lofi.ogg' (lo-fi acoustic guitar/ukulele)
  },

  // ── Typography ──
  fonts: {
    display: 'system-ui',   // Replace with custom font in production
    body: 'system-ui',
  },

  // ── Vehicle Dimensions (for placeholder rectangles) ──
  vehicleSizes: {
    A: { width: 60, height: 90 },   // van — wider
    B: { width: 50, height: 110 },  // truck — taller
  },

  playerSize: { width: 40, height: 70 },
};
