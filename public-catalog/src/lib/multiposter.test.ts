import { describe, expect, it } from 'vitest';

import { buildPosterHref } from './multiposter';

describe('buildPosterHref', () => {
  it('converts inline svg share images into a data url before routing to Studio', () => {
    const href = buildPosterHref({
      origin: 'https://pixelqrypt.com',
      imageUrl: "<svg xmlns='http://www.w3.org/2000/svg'><rect width='10' height='10'/></svg>",
      text: 'share copy',
      prompt: 'quantum prompt',
    });

    const url = new URL(href);

    expect(url.pathname).toBe('/studio');
    expect(url.searchParams.get('shareImage')).toMatch(/^data:image\/svg\+xml/);
  });
});
