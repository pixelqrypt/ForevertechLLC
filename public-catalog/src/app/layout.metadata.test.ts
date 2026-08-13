import { describe, expect, it } from 'vitest';

import { metadata } from './layout';

describe('app metadata icons', () => {
  it('advertises favicon, apple touch icon, and manifest for installable home-screen use', () => {
    expect(metadata.icons).toEqual(
      expect.objectContaining({
        icon: expect.anything(),
        shortcut: expect.anything(),
        apple: expect.anything(),
      }),
    );
    expect(metadata.manifest).toBe('/manifest.webmanifest');
  });

  it('keeps PixelQrypt primary while naming ForeverTech LLC as the owner in metadata copy', () => {
    expect(metadata.applicationName).toBe('PixelQrypt');
    expect(String(metadata.description)).toMatch(/ForeverTech LLC/i);
  });
});
