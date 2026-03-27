import Phaser from 'phaser';
import { SKIN_MANIFEST } from './default/manifest';

function toColorNumber(hex: string): number {
  return Phaser.Display.Color.HexStringToColor(hex).color;
}

const palette = SKIN_MANIFEST.palette;

const COLORS = {
  AMBER: toColorNumber(palette.amber),
  PEACH: toColorNumber(palette.peach),
  CORAL: toColorNumber(palette.coral),
  CREAM: toColorNumber(palette.cream),
  WARM_GRAY: toColorNumber(palette.warmGray),
  SOFT_BROWN: toColorNumber(palette.softBrown),
  DUSTY_ROSE: toColorNumber(palette.dustyRose),
  TWILIGHT: toColorNumber(palette.twilight),
} as const;

const HEX = {
  AMBER: palette.amber,
  PEACH: palette.peach,
  CORAL: palette.coral,
  CREAM: palette.cream,
  WARM_GRAY: palette.warmGray,
  SOFT_BROWN: palette.softBrown,
  DUSTY_ROSE: palette.dustyRose,
  TWILIGHT: palette.twilight,
  TEXT: palette.text,
  TEXT_LIGHT: palette.textLight,
} as const;

export const THEME = {
  HEX,
  COLORS,
  SKY_GRADIENT: SKIN_MANIFEST.skyGradient,
  TOKENS: {
    appBackgroundHex: HEX.CREAM,
    hudTextHex: HEX.CREAM,
    hudShadowHex: HEX.WARM_GRAY,
    gameOverBackground: COLORS.TWILIGHT,
    primaryButtonFill: COLORS.AMBER,
    primaryButtonBorder: COLORS.CREAM,

    skyFill: COLORS.PEACH,
    roadFill: COLORS.WARM_GRAY,
    laneDivider: COLORS.CREAM,
    playerBody: COLORS.CORAL,
    playerOutline: COLORS.CREAM,
    playerTrail: COLORS.TWILIGHT,

    draftMeterBg: COLORS.SOFT_BROWN,
    draftMeterFill: COLORS.AMBER,
    speedLine: COLORS.CREAM,
    draftGlow: COLORS.AMBER,
    milestoneFlash: COLORS.AMBER,

    trafficBody: COLORS.SOFT_BROWN,
    trafficOutline: COLORS.CREAM,

    debugZoneActive: COLORS.AMBER,
    debugZoneIdle: COLORS.CREAM,
    debugZoneOutline: COLORS.CREAM,

    shareGradientStartHex: HEX.AMBER,
    shareGradientEndHex: HEX.TWILIGHT,
    sharePanelHex: HEX.WARM_GRAY,
    shareTextHex: HEX.CREAM,
    shareAccentHex: HEX.PEACH,
  },
} as const;

