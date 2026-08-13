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

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(() => false),
    readdirSync: vi.fn(() => []),
  },
  existsSync: vi.fn(() => false),
  readdirSync: vi.fn(() => []),
}));

describe('Home page', () => {
  it('uses the luxury hero copy and premium entry actions', async () => {
    render(await Home());

    expect(screen.getByRole('heading', { name: /wear a design no one else has/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create Your Piece' })).toHaveAttribute('href', '/studio');
    expect(screen.getByRole('link', { name: 'Explore The Collection' })).toHaveAttribute('href', '/gallery');
  });

  it('renders the luxury storytelling sections instead of the old utility layout', async () => {
    render(await Home());

    expect(screen.getByText(/original designs/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /selected pieces/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /designed to feel like yours/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /create something worth wearing/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /explore piece/i })).toHaveLength(3);
    expect(screen.queryByText(/create your one-of-one fractal tee/i)).not.toBeInTheDocument();
  });
});
