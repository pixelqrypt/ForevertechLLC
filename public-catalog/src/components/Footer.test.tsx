import '@testing-library/jest-dom/vitest';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Footer } from './Footer';

describe('Footer', () => {
  it('shows PixelQrypt as the primary brand and ForeverTech LLC as the owner', () => {
    render(<Footer />);

    expect(screen.getByText('PixelQrypt')).toBeInTheDocument();
    expect(screen.getByText(/owned and operated by forevertech llc/i)).toBeInTheDocument();
  });
});
