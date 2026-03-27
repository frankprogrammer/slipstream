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
  name: 'Tokyo Night — Neon Drift',

  // ── Color Palette ──
  palette: {
    primary: '#7AA2F7', // blue
    secondary: '#7DCFFF', // cyan
    accent: '#BB9AF7', // purple
    background: '#1A1B26', // editor background
    shadow: '#16161E', // panel/deep shadow
    text: '#C0CAF5', // main foreground
    textLight: '#787C99', // muted foreground

    // Tokyo Night aliases using closest human-readable color names.
    cornflowerBlue: '#7AA2F7', // approx common name
    lightSkyBlue: '#7DCFFF', // approx common name
    lavenderViolet: '#BB9AF7', // approximate
    electricCyan: '#2AC3DE', // bright cyan/robin-egg style
    aquamarine: '#73DACA', // bright mint-cyan
    pastelGreen: '#9ECE6A', // bright green
    mutedOrange: '#E0AF68', // approximate
    rosePink: '#F7768E', // approximate
    verySoftBlue: '#C0CAF5', // approximate
    slateBlueGray: '#787C99', // approximate
    eigengrau: '#1E202E', // very dark bluish gray
    charcoalBlue: '#363B54', // approximate
    royalBlue: '#3D59A1', // approximate
  },

  skyGradient: ['#1A1B26', '#3D59A1', '#7AA2F7', '#BB9AF7', '#73DACA', '#9ECE6A'],

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
