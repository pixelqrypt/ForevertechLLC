type Provider = 'mock' | 'dalle' | 'stablediffusion' | 'midjourney';
type Platform = 'linkedin' | 'instagram' | 'twitter';

function ratioForPlatform(p: Platform) {
  if (p === 'instagram') return { w: 1080, h: 1080, label: '1:1' };
  if (p === 'twitter') return { w: 1280, h: 720, label: '16:9' };
  return { w: 1200, h: 628, label: '~1.91:1' };
}

function svgPlaceholder(text: string, w: number, h: number) {
  const bg = '#111827';
  const fg = '#60a5fa';
  const t = text
    .slice(0, 80)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
  <rect width='100%' height='100%' fill='${bg}'/>
  <g font-family='system-ui, -apple-system, Segoe UI' fill='${fg}' text-anchor='middle'>
    <text x='50%' y='45%' font-size='${Math.round(h*0.06)}'>AI Image</text>
    <text x='50%' y='60%' font-size='${Math.round(h*0.04)}'>${t}</text>
  </g>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function sizeForPlatform(platform: Platform): string {
  if (platform === 'instagram') return '1024x1024';
  return '1536x1024';
}

function imagesEndpoint(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/$/, '');
  return trimmed.endsWith('/v1') ? `${trimmed}/images/generations` : `${trimmed}/v1/images/generations`;
}

export async function generateImageForPlatform(provider: Provider, prompt: string, platform: Platform) {
  const { w, h, label } = ratioForPlatform(platform);
  const fallbackUrl = svgPlaceholder(`${platform} ${label}`, w, h);

  if (provider !== 'dalle') {
    return { image_url: fallbackUrl, meta: { provider, width: w, height: h, ratio: label } };
  }

  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    return { image_url: fallbackUrl, meta: { provider, width: w, height: h, ratio: label } };
  }

  try {
    const response = await fetch(imagesEndpoint(process.env.OPENAI_BASE_URL || 'https://api.openai.com'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: sizeForPlatform(platform),
      }),
    });

    if (!response.ok) {
      return { image_url: fallbackUrl, meta: { provider, width: w, height: h, ratio: label } };
    }

    const json = (await response.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
    };
    const firstImage = Array.isArray(json.data) ? json.data[0] : undefined;

    if (firstImage?.url) {
      return { image_url: firstImage.url, meta: { provider, width: w, height: h, ratio: label } };
    }

    if (firstImage?.b64_json) {
      return { image_url: `data:image/png;base64,${firstImage.b64_json}`, meta: { provider, width: w, height: h, ratio: label } };
    }
  } catch {}

  return { image_url: fallbackUrl, meta: { provider, width: w, height: h, ratio: label } };
}
