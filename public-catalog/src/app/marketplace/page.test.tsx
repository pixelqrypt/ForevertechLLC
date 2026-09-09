import '@testing-library/jest-dom/vitest';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import MarketplacePage from './page';

vi.mock('@/components/Header', () => ({
  Header: () => <div>Header</div>,
}));

describe('MarketplacePage', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        items: [
          {
            id: 'public-1',
            imageUrl: 'https://example.com/public-1.png',
            prompt: 'marketplace prompt',
            userName: 'Jose',
            catalogName: "Jose's Catalog",
            userId: 'user-1',
            createdAt: '2026-08-13T12:00:00.000Z',
            visibility: 'public',
          },
        ],
        signupCards: [{ id: 'user-2', name: 'New Creator', createdAt: '2026-08-13T11:00:00.000Z' }],
        featuredCreators: [{ id: 'user-1', name: 'Jose', itemCount: 2, latestAssetCreatedAt: '2026-08-13T12:00:00.000Z' }],
        activeCreators: [{ id: 'user-1', name: 'Jose', itemCount: 2, latestAssetCreatedAt: '2026-08-13T12:00:00.000Z' }],
      }),
    })) as typeof fetch;
  });

  it('renders the public storefront sections and public-only actions', async () => {
    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText('Marketplace')).toBeInTheDocument();
      expect(screen.getByText('Standard Generation')).toBeInTheDocument();
      expect(screen.getByText('Real Quantum Generation')).toBeInTheDocument();
      expect(screen.getByText('Latest Public Assets For Sale')).toBeInTheDocument();
      expect(screen.getByText('Featured Creators')).toBeInTheDocument();
      expect(screen.getByText('Latest Sign-Ups')).toBeInTheDocument();
      expect(screen.getByText('Latest Active Creators')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Customize' })).toHaveAttribute(
      'href',
      '/customize?imageUrl=https%3A%2F%2Fexample.com%2Fpublic-1.png&prompt=marketplace%20prompt',
    );
    expect(screen.getByRole('button', { name: 'Purchase' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /make private/i })).not.toBeInTheDocument();
  });

  it('shows retry UI when the marketplace request fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          items: [],
          signupCards: [],
          featuredCreators: [],
          activeCreators: [],
        }),
      } as Response);

    global.fetch = fetchMock as typeof fetch;

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText('Marketplace unavailable right now.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });
});
