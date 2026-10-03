import { describe, expect, it } from 'vitest';
import {
  buildDeathpunkPhrase,
  createDefaultFusionShirtState,
  createDefaultFusionSideSettings,
} from './fusion-shirt-composer';

describe('fusion shirt composer helpers', () => {
  it('creates front and back defaults with the requested focus presets', () => {
    const state = createDefaultFusionShirtState();

    expect(state.activeSide).toBe('front');
    expect(state.front.focusMode).toBe('subject');
    expect(state.back.focusMode).toBe('balanced');
    expect(state.front.centerProtection).toBeGreaterThan(state.back.centerProtection);
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
});
