import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import Home from './page';

vi.mock('@/components/Header', () => ({
  Header: () => <div>Header</div>,
}));

vi.mock('@/components/CatalogGrid', () => ({
  CatalogGrid: () => <div>Catalog Grid</div>,
}));

vi.mock('@/components/TwitterFeed', () => ({
  TwitterFeed: () => <div>Twitter Feed</div>,
}));

vi.mock('@/lib/galleryStore', () => ({
  getGalleryItems: () => [
    {
      id: 'gallery-1',
      imageUrl: '/images/user-generated-preview.svg',
      prompt: 'User generated spiral bloom tee',
      userName: 'Ari',
      catalogName: "Ari's Public Catalog",
      isFavorite: false,
      isQuantumVerified: false,
      createdAt: '2026-08-12T00:00:00.000Z',
    },
    {
      id: 'gallery-2',
      imageUrl: '/images/user-generated-preview-2.svg',
      prompt: 'Community neon streetwear design',
      userName: 'Mila',
      catalogName: "Mila's Public Catalog",
      isFavorite: true,
      isQuantumVerified: true,
      createdAt: '2026-08-11T00:00:00.000Z',
    },
  ],
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(() => false),
    readdirSync: vi.fn(() => []),
  },
  existsSync: vi.fn(() => false),
  readdirSync: vi.fn(() => []),
}));

describe('Home page', () => {
  it('shows compact admin, user, and quantum comparison boxes for new visitors', async () => {
    render(await Home());

    expect(screen.getByRole('heading', { name: /discover admin drops, community designs, and quantum builds/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Admin Products' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'User Generated Products' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Real Quantum Generation vs Standard Generation' })).toBeInTheDocument();
    expect(screen.getAllByText('Latest Build').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Public Gallery').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Real Quantum Generation').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Standard Generation').length).toBeGreaterThan(0);
    expect(screen.queryByText('Catalog Grid')).not.toBeInTheDocument();
  });
});
