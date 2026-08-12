import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { CatalogGrid } from './CatalogGrid';

vi.mock('./CatalogItem', () => ({
  CatalogItem: ({ content }: { content: string }) => <div>{content}</div>,
}));

vi.mock('./LiveBadge', () => ({
  LiveBadge: () => <div>Live</div>,
}));

describe('CatalogGrid', () => {
  it('shows a clean empty state when there are no published builds yet', () => {
    render(<CatalogGrid initialPosts={[]} />);

    expect(screen.getByText(/no builds published yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/loading catalog/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /clear all filters/i })).not.toBeInTheDocument();
  });
});
