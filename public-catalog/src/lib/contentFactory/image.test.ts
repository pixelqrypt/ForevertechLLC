import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as mod from './image';

describe('contentFactory/image', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    global.fetch = originalFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns correct ratio for instagram', async () => {
    const r = await mod.generateImageForPlatform('mock', 'hello', 'instagram');
    expect(r.meta.width).toBe(1080);
    expect(r.meta.height).toBe(1080);
    expect(r.meta.ratio).toBe('1:1');
  });

  it('returns correct ratio for twitter', async () => {
    const r = await mod.generateImageForPlatform('mock', 'hello', 'twitter');
    expect(r.meta.width).toBe(1280);
    expect(r.meta.height).toBe(720);
    expect(r.meta.ratio).toBe('16:9');
  });

  it('falls back to SVG placeholder when OpenAI key missing', async () => {
    const r = await mod.generateImageForPlatform('dalle', 'a cat', 'instagram');
    expect(typeof r.image_url).toBe('string');
    expect(r.image_url.startsWith('data:image/svg+xml')).toBe(true);
    expect(r.meta.provider).toBe('dalle');
  });

  it('calls the OpenAI images API for dalle when a key is configured', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_BASE_URL = 'https://api.openai.com';
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        data: [{ url: 'https://cdn.example.com/generated.png' }],
      }),
    })) as typeof fetch;
    global.fetch = fetchMock;

    const r = await mod.generateImageForPlatform('dalle', 'a cat', 'instagram');

    expect(r.image_url).toBe('https://cdn.example.com/generated.png');
    expect(r.meta.provider).toBe('dalle');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('https://api.openai.com/v1/images/generations');
  });

  it('renders readable fallback text instead of percent-encoded labels', async () => {
    const r = await mod.generateImageForPlatform('mock', 'hello', 'linkedin' as never);
    const encoded = r.image_url.split(',')[1];
    const svg = Buffer.from(encoded, 'base64').toString('utf8');
    expect(svg).toContain('linkedin ~1.91:1');
    expect(svg).not.toContain('linkedin%20');
    expect(svg).not.toContain('%3A1');
  });
});
