export type FusionShirtSide = 'front' | 'back';
export type FusionPhraseMode = 'auto' | 'manual' | 'both';
export type FusionFocusMode = 'subject' | 'balanced' | 'background';
export type FusionFontStyle = 'chrome-sans' | 'signal-condensed' | 'riot-mono';
export type FusionTextPlacement = 'top' | 'center' | 'bottom';

export type FusionSideSettings = {
  focusMode: FusionFocusMode;
  abstractStrength: number;
  edgeFade: number;
  glow: number;
  backgroundBrightness: number;
  centerProtection: number;
  scale: number;
  verticalOffset: number;
  phraseMode: FusionPhraseMode;
  autoText: string;
  manualText: string;
  fontStyle: FusionFontStyle;
  textSize: number;
  textTracking: number;
  textOutline: number;
  textGlow: number;
  textPlacement: FusionTextPlacement;
};

export type FusionShirtState = {
  activeSide: FusionShirtSide;
  front: FusionSideSettings;
  back: FusionSideSettings;
};

type FusionFocusBlendSettings = Pick<
  FusionSideSettings,
  | 'focusMode'
  | 'abstractStrength'
  | 'edgeFade'
  | 'glow'
  | 'backgroundBrightness'
  | 'centerProtection'
  | 'scale'
  | 'verticalOffset'
>;

const ADJECTIVES = ['Neon', 'Chrome', 'Future', 'Midnight', 'Static', 'Ghost'];
const NOUNS = ['Signal', 'Ritual', 'Horizon', 'Bloom', 'Circuit', 'Cathedral'];
const FOCUS_PRESETS: Record<FusionShirtSide, Record<FusionFocusMode, FusionFocusBlendSettings>> = {
  front: {
    subject: {
      focusMode: 'subject',
      abstractStrength: 0.58,
      edgeFade: 0.64,
      glow: 0.32,
      backgroundBrightness: 1.1,
      centerProtection: 0.84,
      scale: 1,
      verticalOffset: 0,
    },
    balanced: {
      focusMode: 'balanced',
      abstractStrength: 0.68,
      edgeFade: 0.7,
      glow: 0.36,
      backgroundBrightness: 1.14,
      centerProtection: 0.72,
      scale: 1.04,
      verticalOffset: 0.03,
    },
    background: {
      focusMode: 'background',
      abstractStrength: 0.76,
      edgeFade: 0.84,
      glow: 0.42,
      backgroundBrightness: 1.18,
      centerProtection: 0.58,
      scale: 1.08,
      verticalOffset: 0.06,
    },
  },
  back: {
    subject: {
      focusMode: 'subject',
      abstractStrength: 0.62,
      edgeFade: 0.66,
      glow: 0.34,
      backgroundBrightness: 1.08,
      centerProtection: 0.76,
      scale: 0.98,
      verticalOffset: -0.02,
    },
    balanced: {
      focusMode: 'balanced',
      abstractStrength: 0.74,
      edgeFade: 0.72,
      glow: 0.38,
      backgroundBrightness: 1.12,
      centerProtection: 0.66,
      scale: 1.02,
      verticalOffset: 0.04,
    },
    background: {
      focusMode: 'background',
      abstractStrength: 0.82,
      edgeFade: 0.88,
      glow: 0.46,
      backgroundBrightness: 1.18,
      centerProtection: 0.52,
      scale: 1.08,
      verticalOffset: 0.08,
    },
  },
};

function hashSeed(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

export function buildDeathpunkPhrase(prompt: string) {
  const seed = hashSeed(prompt.trim().toLowerCase() || 'deathpunk');
  const adjective = ADJECTIVES[seed % ADJECTIVES.length];
  const noun = NOUNS[Math.floor(seed / ADJECTIVES.length) % NOUNS.length];
  return `${adjective} ${noun}`;
}

export function getFocusSettings(
  side: FusionShirtSide,
  focusMode: FusionFocusMode,
): FusionFocusBlendSettings {
  return FOCUS_PRESETS[side][focusMode];
}

export function createDefaultFusionSideSettings(
  side: FusionShirtSide,
  focusMode?: FusionFocusMode,
): FusionSideSettings {
  const defaultFocusMode = focusMode ?? (side === 'front' ? 'subject' : 'balanced');

  return {
    ...getFocusSettings(side, defaultFocusMode),
    phraseMode: 'auto',
    autoText: '',
    manualText: '',
    fontStyle: side === 'front' ? 'signal-condensed' : 'riot-mono',
    textSize: side === 'front' ? 0.14 : 0.18,
    textTracking: 0.08,
    textOutline: 0.35,
    textGlow: 0.28,
    textPlacement: side === 'front' ? 'bottom' : 'center',
  };
}

export function createDefaultFusionShirtState(): FusionShirtState {
  return {
    activeSide: 'front',
    front: createDefaultFusionSideSettings('front'),
    back: createDefaultFusionSideSettings('back'),
  };
}
