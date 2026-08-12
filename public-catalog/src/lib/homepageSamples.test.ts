import { describe, expect, it } from 'vitest';

import { pickHomepageComparisonSamples } from './homepageSamples';

describe('pickHomepageComparisonSamples', () => {
  const fallback = {
    quantum: {
      imageUrl: '/images/ai-gen-1.png',
      title: 'Real Quantum Generation',
      description: 'Pinned studio-generated quantum fallback',
    },
    standard: {
      imageUrl: '/images/ai-gen-2.png',
      title: 'Standard Generation',
      description: 'Pinned studio-generated standard fallback',
    },
  };

  it('chooses the newest quantum and standard studio outputs when both exist', () => {
    const result = pickHomepageComparisonSamples(
      [
        {
          id: 'free-1',
          imageUrl: '/uploads/standard-old.png',
          createdAt: '2026-08-12T09:00:00.000Z',
          isQuantumVerified: false,
        },
        {
          id: 'quantum-1',
          imageUrl: '/uploads/quantum-old.png',
          createdAt: '2026-08-12T09:05:00.000Z',
          isQuantumVerified: true,
        },
        {
          id: 'free-2',
          imageUrl: '/uploads/standard-new.png',
          createdAt: '2026-08-12T10:00:00.000Z',
          isQuantumVerified: false,
        },
        {
          id: 'quantum-2',
          imageUrl: '/uploads/quantum-new.png',
          createdAt: '2026-08-12T10:05:00.000Z',
          isQuantumVerified: true,
        },
      ],
      fallback,
    );

    expect(result.standard.imageUrl).toBe('/uploads/standard-new.png');
    expect(result.quantum.imageUrl).toBe('/uploads/quantum-new.png');
    expect(result.standard.isFallback).toBe(false);
    expect(result.quantum.isFallback).toBe(false);
  });

  it('falls back only for the missing mode', () => {
    const result = pickHomepageComparisonSamples(
      [
        {
          id: 'free-2',
          imageUrl: '/uploads/standard-new.png',
          createdAt: '2026-08-12T10:00:00.000Z',
          isQuantumVerified: false,
        },
      ],
      fallback,
    );

    expect(result.standard.imageUrl).toBe('/uploads/standard-new.png');
    expect(result.standard.isFallback).toBe(false);
    expect(result.quantum.imageUrl).toBe('/images/ai-gen-1.png');
    expect(result.quantum.isFallback).toBe(true);
  });
});
