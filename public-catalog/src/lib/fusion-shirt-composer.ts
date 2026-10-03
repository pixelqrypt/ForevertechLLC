export type FusionShirtSide = 'front' | 'back';
export type FusionPhraseMode = 'auto' | 'manual' | 'both';
export type FusionFocusMode = 'subject' | 'balanced' | 'background';

export type FusionSideSettings = {
  focusMode: FusionFocusMode;
  centerProtection: number;
  centerBlendAlpha: number;
  foregroundAlpha: number;
  foregroundFadeInner: number;
  foregroundFadeOuter: number;
  unionRingAlpha: number;
  phraseMode: FusionPhraseMode;
  autoText: string;
  manualText: string;
};

export type FusionShirtState = {
  activeSide: FusionShirtSide;
  front: FusionSideSettings;
  back: FusionSideSettings;
};

const ADJECTIVES = ['Neon', 'Chrome', 'Future', 'Midnight', 'Static', 'Ghost'];
const NOUNS = ['Signal', 'Ritual', 'Horizon', 'Bloom', 'Circuit', 'Cathedral'];

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

export function getFocusSettings(side: FusionShirtSide, focusMode: FusionFocusMode) {
  if (focusMode === 'subject') {
    return {
      focusMode,
      centerProtection: side === 'front' ? 0.84 : 0.76,
      centerBlendAlpha: 0.1,
      foregroundAlpha: side === 'front' ? 0.75 : 0.78,
      foregroundFadeInner: 0.18,
      foregroundFadeOuter: 0.68,
      unionRingAlpha: 0.16,
    };
  }

  if (focusMode === 'background') {
    return {
      focusMode,
      centerProtection: side === 'front' ? 0.58 : 0.52,
      centerBlendAlpha: 0.18,
      foregroundAlpha: side === 'front' ? 0.64 : 0.68,
      foregroundFadeInner: 0.12,
      foregroundFadeOuter: 0.84,
      unionRingAlpha: 0.28,
    };
  }

  return {
    focusMode,
    centerProtection: side === 'front' ? 0.72 : 0.66,
    centerBlendAlpha: 0.13,
    foregroundAlpha: side === 'front' ? 0.7 : 0.74,
    foregroundFadeInner: 0.15,
    foregroundFadeOuter: 0.76,
    unionRingAlpha: 0.22,
  };
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
  };
}

export function createDefaultFusionShirtState(): FusionShirtState {
  return {
    activeSide: 'front',
    front: createDefaultFusionSideSettings('front'),
    back: createDefaultFusionSideSettings('back'),
  };
}
