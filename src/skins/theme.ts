import Phaser from 'phaser';
import { SKIN_MANIFEST } from './default/manifest';

function toColorNumber(hex: string): number {
  return Phaser.Display.Color.HexStringToColor(hex).color;
}

const palette = SKIN_MANIFEST.palette;

const COLORS = {
  BACKGROUND: toColorNumber(palette.background),
  SHADOW: toColorNumber(palette.shadow),
  CORNFLOWER_BLUE: toColorNumber(palette.cornflowerBlue),
  LIGHT_SKY_BLUE: toColorNumber(palette.lightSkyBlue),
  LAVENDER_VIOLET: toColorNumber(palette.lavenderViolet),
  ELECTRIC_CYAN: toColorNumber(palette.electricCyan),
  AQUAMARINE: toColorNumber(palette.aquamarine),
  PASTEL_GREEN: toColorNumber(palette.pastelGreen),
  MUTED_ORANGE: toColorNumber(palette.mutedOrange),
  ROSE_PINK: toColorNumber(palette.rosePink),
  VERY_SOFT_BLUE: toColorNumber(palette.verySoftBlue),
  SLATE_BLUE_GRAY: toColorNumber(palette.slateBlueGray),
  EIGENGRAU: toColorNumber(palette.eigengrau),
  CHARCOAL_BLUE: toColorNumber(palette.charcoalBlue),
  ROYAL_BLUE: toColorNumber(palette.royalBlue),
} as const;

const HEX = {
  BACKGROUND: palette.background,
  SHADOW: palette.shadow,
  CORNFLOWER_BLUE: palette.cornflowerBlue,
  LIGHT_SKY_BLUE: palette.lightSkyBlue,
  LAVENDER_VIOLET: palette.lavenderViolet,
  ELECTRIC_CYAN: palette.electricCyan,
  AQUAMARINE: palette.aquamarine,
  PASTEL_GREEN: palette.pastelGreen,
  MUTED_ORANGE: palette.mutedOrange,
  ROSE_PINK: palette.rosePink,
  VERY_SOFT_BLUE: palette.verySoftBlue,
  SLATE_BLUE_GRAY: palette.slateBlueGray,
  EIGENGRAU: palette.eigengrau,
  CHARCOAL_BLUE: palette.charcoalBlue,
  ROYAL_BLUE: palette.royalBlue,
  TEXT: palette.text,
  TEXT_LIGHT: palette.textLight,
} as const;

export const THEME = {
  HEX,
  COLORS,
  SKY_GRADIENT: SKIN_MANIFEST.skyGradient,
  TOKENS: {
    appBackgroundHex: HEX.BACKGROUND,
    hudTextHex: HEX.VERY_SOFT_BLUE,
    hudShadowHex: HEX.EIGENGRAU,
    gameOverBackground: COLORS.ROYAL_BLUE,
    primaryButtonFill: COLORS.CORNFLOWER_BLUE,
    primaryButtonBorder: COLORS.VERY_SOFT_BLUE,

    skyFill: COLORS.CORNFLOWER_BLUE,
    roadFill: COLORS.EIGENGRAU,
    laneDivider: COLORS.VERY_SOFT_BLUE,
    playerBody: COLORS.LAVENDER_VIOLET,
    playerOutline: COLORS.VERY_SOFT_BLUE,
    playerTrail: COLORS.LAVENDER_VIOLET,

    draftMeterBg: COLORS.CHARCOAL_BLUE,
    draftMeterFill: COLORS.ELECTRIC_CYAN,
    speedLine: COLORS.ELECTRIC_CYAN,
    draftGlow: COLORS.AQUAMARINE,
    milestoneFlash: COLORS.LAVENDER_VIOLET,

    trafficBody: COLORS.CHARCOAL_BLUE,
    trafficOutline: COLORS.VERY_SOFT_BLUE,

    debugZoneActive: COLORS.PASTEL_GREEN,
    debugZoneIdle: COLORS.VERY_SOFT_BLUE,
    debugZoneOutline: COLORS.VERY_SOFT_BLUE,

    shareGradientStartHex: HEX.CORNFLOWER_BLUE,
    shareGradientEndHex: HEX.ROYAL_BLUE,
    sharePanelHex: HEX.EIGENGRAU,
    shareTextHex: HEX.VERY_SOFT_BLUE,
    shareAccentHex: HEX.PASTEL_GREEN,
  },
} as const;

