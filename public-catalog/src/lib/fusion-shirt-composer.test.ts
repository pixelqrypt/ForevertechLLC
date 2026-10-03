import { describe, expect, it } from 'vitest';
import {
  buildDeathpunkPhrase,
  createDefaultFusionShirtState,
  createDefaultFusionSideSettings,
  getFocusSettings,
} from './fusion-shirt-composer';

describe('fusion shirt composer helpers', () => {
  it('creates front and back defaults with the requested focus presets', () => {
    const state = createDefaultFusionShirtState();

    expect(state.activeSide).toBe('front');
    expect(state.front.focusMode).toBe('subject');
    expect(state.back.focusMode).toBe('balanced');
    expect(state.front.centerProtection).toBeGreaterThan(state.back.centerProtection);
    expect(state.front).toMatchObject({
      abstractStrength: 0.58,
      edgeFade: 0.64,
      glow: 0.32,
      backgroundBrightness: 1.1,
      scale: 1,
      verticalOffset: 0,
      fontStyle: 'signal-condensed',
      textSize: 0.14,
      textTracking: 0.08,
      textOutline: 0.35,
      textGlow: 0.28,
      textPlacement: 'bottom',
    });
    expect(state.back).toMatchObject({
      abstractStrength: 0.74,
      edgeFade: 0.72,
      glow: 0.38,
      backgroundBrightness: 1.12,
      scale: 1.02,
      verticalOffset: 0.04,
      fontStyle: 'riot-mono',
      textSize: 0.18,
      textTracking: 0.08,
      textOutline: 0.35,
      textGlow: 0.28,
      textPlacement: 'center',
    });
  });

  it('creates deterministic phrases from the same prompt', () => {
    expect(buildDeathpunkPhrase('violet ghost')).toBe(buildDeathpunkPhrase('violet ghost'));
  });

  it('returns short clean phrases', () => {
    const phrase = buildDeathpunkPhrase('violet ghost');

    expect(phrase.length).toBeGreaterThan(0);
    expect(phrase.split(' ').length).toBeLessThanOrEqual(4);
    expect(phrase).toMatch(/^[A-Za-z ]+$/);
  });

  it('allows overriding the default side focus preset explicitly', () => {
    expect(createDefaultFusionSideSettings('front', 'background').focusMode).toBe('background');
    expect(createDefaultFusionSideSettings('back', 'subject').focusMode).toBe('subject');
  });

  it('maps focus presets onto the full blend contract', () => {
    expect(getFocusSettings('back', 'background')).toMatchObject({
      focusMode: 'background',
      abstractStrength: 0.82,
      edgeFade: 0.88,
      glow: 0.46,
      backgroundBrightness: 1.18,
      centerProtection: 0.52,
      scale: 1.08,
      verticalOffset: 0.08,
    });
  });
});
