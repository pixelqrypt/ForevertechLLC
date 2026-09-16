# Studio Quantum Aura Blend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Quantum Aura Blend` mode inside `Studio` that applies a low-cost local hybrid portrait effect with a built-in sample/demo, three color presets, and emotional spectrum controls.

**Architecture:** Keep the feature inside `src/app/studio/page.tsx`, but move the new effect UI and composition logic into small focused units. Use a browser-side canvas compositor in `src/lib/quantumAuraBlend.ts` to avoid new backend services and keep iteration cost near zero while still producing a reviewable aura-plus-fractal result.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, HTML Canvas

---

## File Structure

### Create
- `src/types/quantumAuraBlend.ts`
  - shared preset, emotion, request, and result types
- `src/lib/quantumAuraBlend.ts`
  - canvas-based local composition pipeline and preset constants
- `src/lib/quantumAuraBlend.test.ts`
  - unit tests for presets, emotional-spectrum mappings, and metadata generation
- `src/components/studio/QuantumAuraBlendPreview.tsx`
  - original/result preview surface
- `src/components/studio/QuantumAuraBlendPanel.tsx`
  - image source controls, preset controls, emotion controls, sliders, and sample/demo actions

### Modify
- `src/app/studio/page.tsx`
  - add mode toggle, state, sample/demo wiring, and result integration
- `src/app/studio/page.test.tsx`
  - add Studio-level tests for the new mode and sample/demo flow

---

### Task 1: Add Shared Types And Local Blend Configuration

**Files:**
- Create: `src/types/quantumAuraBlend.ts`
- Create: `src/lib/quantumAuraBlend.test.ts`
- Create: `src/lib/quantumAuraBlend.ts`

- [ ] **Step 1: Write the failing type/config test**

```ts
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_QUANTUM_AURA_EMOTION,
  DEFAULT_QUANTUM_AURA_PRESET,
  QUANTUM_AURA_EMOTIONS,
  QUANTUM_AURA_PRESETS,
  buildQuantumAuraMetadata,
} from './quantumAuraBlend';

describe('quantumAuraBlend config', () => {
  it('exposes the approved three presets and three emotional states', () => {
    expect(QUANTUM_AURA_PRESETS.map((item) => item.id)).toEqual([
      'neon-violet',
      'solar-gold',
      'cosmic-rainbow',
    ]);
    expect(QUANTUM_AURA_EMOTIONS.map((item) => item.id)).toEqual([
      'calm',
      'charged',
      'transcendent',
    ]);
    expect(DEFAULT_QUANTUM_AURA_PRESET).toBe('neon-violet');
    expect(DEFAULT_QUANTUM_AURA_EMOTION).toBe('calm');
  });

  it('builds stable metadata for preview outputs', () => {
    const metadata = buildQuantumAuraMetadata({
      preset: 'solar-gold',
      emotion: 'charged',
      intensity: 0.72,
      spread: 0.61,
      distortion: 0.84,
    });

    expect(metadata).toMatchObject({
      compositionMode: 'quantum-aura-blend',
      preset: 'solar-gold',
      emotion: 'charged',
      intensity: 0.72,
      spread: 0.61,
      distortion: 0.84,
    });
    expect(typeof metadata.generationTimestamp).toBe('string');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/quantumAuraBlend.test.ts`
Expected: FAIL with import errors because `src/lib/quantumAuraBlend.ts` does not exist yet

- [ ] **Step 3: Write the shared types**

```ts
export type QuantumAuraPresetId = 'neon-violet' | 'solar-gold' | 'cosmic-rainbow';

export type QuantumAuraEmotionId = 'calm' | 'charged' | 'transcendent';

export type QuantumAuraPreset = {
  id: QuantumAuraPresetId;
  label: string;
  primaryColors: [string, string, string];
  glowColor: string;
  backgroundDistortionBias: number;
};

export type QuantumAuraEmotion = {
  id: QuantumAuraEmotionId;
  label: string;
  glowIntensity: number;
  auraSpread: number;
  fractalTurbulence: number;
  subjectClarity: number;
};

export type QuantumAuraBlendRequest = {
  sourceImageUrl: string;
  preset: QuantumAuraPresetId;
  emotion: QuantumAuraEmotionId;
  intensity: number;
  spread: number;
  distortion: number;
};

export type QuantumAuraBlendMetadata = {
  compositionMode: 'quantum-aura-blend';
  preset: QuantumAuraPresetId;
  emotion: QuantumAuraEmotionId;
  intensity: number;
  spread: number;
  distortion: number;
  generationTimestamp: string;
};

export type QuantumAuraBlendResult = {
  outputDataUrl: string;
  metadata: QuantumAuraBlendMetadata;
};
```

- [ ] **Step 4: Write the config module**

```ts
import type {
  QuantumAuraBlendMetadata,
  QuantumAuraEmotion,
  QuantumAuraEmotionId,
  QuantumAuraPreset,
  QuantumAuraPresetId,
} from '@/types/quantumAuraBlend';

export const QUANTUM_AURA_PRESETS: QuantumAuraPreset[] = [
  {
    id: 'neon-violet',
    label: 'Neon Violet',
    primaryColors: ['#6d28d9', '#9333ea', '#38bdf8'],
    glowColor: '#c084fc',
    backgroundDistortionBias: 0.56,
  },
  {
    id: 'solar-gold',
    label: 'Solar Gold',
    primaryColors: ['#f59e0b', '#f97316', '#fde68a'],
    glowColor: '#facc15',
    backgroundDistortionBias: 0.48,
  },
  {
    id: 'cosmic-rainbow',
    label: 'Cosmic Rainbow',
    primaryColors: ['#ec4899', '#8b5cf6', '#22d3ee'],
    glowColor: '#f0abfc',
    backgroundDistortionBias: 0.72,
  },
];

export const QUANTUM_AURA_EMOTIONS: QuantumAuraEmotion[] = [
  { id: 'calm', label: 'Calm', glowIntensity: 0.42, auraSpread: 0.58, fractalTurbulence: 0.24, subjectClarity: 0.9 },
  { id: 'charged', label: 'Charged', glowIntensity: 0.72, auraSpread: 0.66, fractalTurbulence: 0.54, subjectClarity: 0.84 },
  { id: 'transcendent', label: 'Transcendent', glowIntensity: 0.92, auraSpread: 0.8, fractalTurbulence: 0.82, subjectClarity: 0.78 },
];

export const DEFAULT_QUANTUM_AURA_PRESET: QuantumAuraPresetId = 'neon-violet';
export const DEFAULT_QUANTUM_AURA_EMOTION: QuantumAuraEmotionId = 'calm';

export function buildQuantumAuraMetadata(input: {
  preset: QuantumAuraPresetId;
  emotion: QuantumAuraEmotionId;
  intensity: number;
  spread: number;
  distortion: number;
}): QuantumAuraBlendMetadata {
  return {
    compositionMode: 'quantum-aura-blend',
    preset: input.preset,
    emotion: input.emotion,
    intensity: input.intensity,
    spread: input.spread,
    distortion: input.distortion,
    generationTimestamp: new Date().toISOString(),
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/lib/quantumAuraBlend.test.ts`
Expected: PASS with `2 passed`

- [ ] **Step 6: Commit**

```bash
git add src/types/quantumAuraBlend.ts src/lib/quantumAuraBlend.ts src/lib/quantumAuraBlend.test.ts
git commit -m "feat(studio): add quantum aura blend config"
```

### Task 2: Build The Local Quantum Aura Composition Pipeline

**Files:**
- Modify: `src/lib/quantumAuraBlend.ts`
- Test: `src/lib/quantumAuraBlend.test.ts`

- [ ] **Step 1: Extend the failing test for safe composition helpers**

```ts
import { describe, expect, it } from 'vitest';

import { clampQuantumAuraControl, getQuantumAuraStyle } from './quantumAuraBlend';

describe('quantumAuraBlend style mapping', () => {
  it('clamps slider values into the safe preview range', () => {
    expect(clampQuantumAuraControl(-10)).toBe(0);
    expect(clampQuantumAuraControl(0.5)).toBe(0.5);
    expect(clampQuantumAuraControl(4)).toBe(1);
  });

  it('derives stronger glow and distortion for transcendent rainbow output', () => {
    const style = getQuantumAuraStyle({
      preset: 'cosmic-rainbow',
      emotion: 'transcendent',
      intensity: 0.8,
      spread: 0.7,
      distortion: 0.9,
    });

    expect(style.glowStrength).toBeGreaterThan(0.8);
    expect(style.distortionStrength).toBeGreaterThan(0.8);
    expect(style.palette).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/quantumAuraBlend.test.ts`
Expected: FAIL with missing exports for `clampQuantumAuraControl` and `getQuantumAuraStyle`

- [ ] **Step 3: Add style derivation helpers**

```ts
export function clampQuantumAuraControl(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function getQuantumAuraStyle(input: {
  preset: QuantumAuraPresetId;
  emotion: QuantumAuraEmotionId;
  intensity: number;
  spread: number;
  distortion: number;
}) {
  const preset = QUANTUM_AURA_PRESETS.find((item) => item.id === input.preset) || QUANTUM_AURA_PRESETS[0];
  const emotion = QUANTUM_AURA_EMOTIONS.find((item) => item.id === input.emotion) || QUANTUM_AURA_EMOTIONS[0];
  const intensity = clampQuantumAuraControl(input.intensity);
  const spread = clampQuantumAuraControl(input.spread);
  const distortion = clampQuantumAuraControl(input.distortion);

  return {
    palette: preset.primaryColors,
    glowColor: preset.glowColor,
    glowStrength: clampQuantumAuraControl(intensity * 0.65 + emotion.glowIntensity * 0.55),
    spreadStrength: clampQuantumAuraControl(spread * 0.6 + emotion.auraSpread * 0.5),
    distortionStrength: clampQuantumAuraControl(distortion * 0.62 + emotion.fractalTurbulence * 0.5 + preset.backgroundDistortionBias * 0.2),
    subjectClarity: emotion.subjectClarity,
  };
}
```

- [ ] **Step 4: Add the browser composition function**

```ts
export async function createQuantumAuraBlend(request: QuantumAuraBlendRequest): Promise<QuantumAuraBlendResult> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = request.sourceImageUrl;
  await image.decode();

  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');

  const style = getQuantumAuraStyle(request);

  ctx.drawImage(image, 0, 0, size, size);

  const grad = ctx.createRadialGradient(size * 0.5, size * 0.48, size * 0.08, size * 0.5, size * 0.48, size * (0.26 + style.spreadStrength * 0.18));
  grad.addColorStop(0, `${style.glowColor}00`);
  grad.addColorStop(0.35, `${style.glowColor}55`);
  grad.addColorStop(0.7, `${style.glowColor}88`);
  grad.addColorStop(1, '#00000000');

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.filter = `blur(${24 + Math.round(style.glowStrength * 36)}px) saturate(${1.15 + style.glowStrength * 0.65})`;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, style.palette[0]);
  bg.addColorStop(0.5, style.palette[1]);
  bg.addColorStop(1, style.palette[2]);
  ctx.globalAlpha = 0.18 + style.distortionStrength * 0.22;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.12 + style.distortionStrength * 0.16;
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    const radius = 40 + Math.random() * 180;
    ctx.fillStyle = style.palette[i % style.palette.length];
    ctx.filter = `blur(${18 + Math.round(style.distortionStrength * 22)}px)`;
    ctx.arc(
      Math.random() * size,
      Math.random() * size,
      radius,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();

  const metadata = buildQuantumAuraMetadata({
    preset: request.preset,
    emotion: request.emotion,
    intensity: request.intensity,
    spread: request.spread,
    distortion: request.distortion,
  });

  return {
    outputDataUrl: canvas.toDataURL('image/png'),
    metadata,
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- src/lib/quantumAuraBlend.test.ts`
Expected: PASS with `4 passed`

- [ ] **Step 6: Commit**

```bash
git add src/lib/quantumAuraBlend.ts src/lib/quantumAuraBlend.test.ts
git commit -m "feat(studio): add local quantum aura compositor"
```

### Task 3: Add Preview And Control Components With Built-In Sample

**Files:**
- Create: `src/components/studio/QuantumAuraBlendPreview.tsx`
- Create: `src/components/studio/QuantumAuraBlendPanel.tsx`
- Test: `src/app/studio/page.test.tsx`

- [ ] **Step 1: Write the failing Studio sample test**

```ts
it('shows the quantum aura blend sample controls and three presets', async () => {
  await renderStudioPage();

  fireEvent.click(screen.getByRole('button', { name: 'Quantum Aura Blend' }));

  await waitFor(() => {
    expect(screen.getByText('Quantum Aura Blend')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use attached sample' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Neon Violet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solar Gold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cosmic Rainbow' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Calm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Charged' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Transcendent' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/studio/page.test.tsx`
Expected: FAIL because the new mode and panel do not exist

- [ ] **Step 3: Create the preview component**

```tsx
type QuantumAuraBlendPreviewProps = {
  originalImageUrl: string | null;
  resultImageUrl: string | null;
};

export function QuantumAuraBlendPreview({ originalImageUrl, resultImageUrl }: QuantumAuraBlendPreviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Original</div>
        {originalImageUrl ? <img src={originalImageUrl} alt="Original portrait source" className="mt-3 w-full rounded-xl object-cover" /> : null}
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Quantum Aura Result</div>
        {resultImageUrl ? <img src={resultImageUrl} alt="Quantum aura blended result" className="mt-3 w-full rounded-xl object-cover" /> : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create the control panel component**

```tsx
type QuantumAuraBlendPanelProps = {
  sourceImageUrl: string | null;
  sampleImageUrl: string;
  preset: QuantumAuraPresetId;
  emotion: QuantumAuraEmotionId;
  intensity: number;
  spread: number;
  distortion: number;
  resultImageUrl: string | null;
  onUseSample: () => void;
  onPresetChange: (preset: QuantumAuraPresetId) => void;
  onEmotionChange: (emotion: QuantumAuraEmotionId) => void;
  onIntensityChange: (value: number) => void;
  onSpreadChange: (value: number) => void;
  onDistortionChange: (value: number) => void;
  onGenerate: () => Promise<void> | void;
};
```

Include in the component:

```tsx
<button type="button" onClick={onUseSample}>Use attached sample</button>
<button type="button" onClick={() => onPresetChange('neon-violet')}>Neon Violet</button>
<button type="button" onClick={() => onPresetChange('solar-gold')}>Solar Gold</button>
<button type="button" onClick={() => onPresetChange('cosmic-rainbow')}>Cosmic Rainbow</button>
<button type="button" onClick={() => onEmotionChange('calm')}>Calm</button>
<button type="button" onClick={() => onEmotionChange('charged')}>Charged</button>
<button type="button" onClick={() => onEmotionChange('transcendent')}>Transcendent</button>
```

- [ ] **Step 5: Run tests to verify they still fail only on missing Studio wiring**

Run: `npm test -- src/app/studio/page.test.tsx`
Expected: FAIL because `Studio` still does not render the new controls

- [ ] **Step 6: Commit**

```bash
git add src/components/studio/QuantumAuraBlendPreview.tsx src/components/studio/QuantumAuraBlendPanel.tsx
git commit -m "feat(studio): add quantum aura blend panel components"
```

### Task 4: Wire Quantum Aura Blend Into Studio And Show The Sample

**Files:**
- Modify: `src/app/studio/page.tsx`
- Test: `src/app/studio/page.test.tsx`

- [ ] **Step 1: Extend the Studio test with sample generation behavior**

```ts
it('applies the attached sample through the quantum aura blend workflow', async () => {
  await renderStudioPage();

  fireEvent.click(screen.getByRole('button', { name: 'Quantum Aura Blend' }));
  fireEvent.click(screen.getByRole('button', { name: 'Use attached sample' }));
  fireEvent.click(screen.getByRole('button', { name: 'Apply Quantum Aura Blend' }));

  await waitFor(() => {
    expect(screen.getByAltText('Quantum aura blended result')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/studio/page.test.tsx`
Expected: FAIL because Studio does not yet render or run the quantum aura workflow

- [ ] **Step 3: Add Studio state and mode selection**

In `src/app/studio/page.tsx`, add:

```tsx
type StudioCreationMode = 'standard' | 'real-quantum' | 'quantum-aura-blend';

const ATTACHED_SAMPLE_IMAGE = '/images/studio-quantum-aura-sample.png';

const [studioCreationMode, setStudioCreationMode] = useState<StudioCreationMode>('standard');
const [auraSourceImageUrl, setAuraSourceImageUrl] = useState<string | null>(null);
const [auraResultImageUrl, setAuraResultImageUrl] = useState<string | null>(null);
const [auraPreset, setAuraPreset] = useState<QuantumAuraPresetId>(DEFAULT_QUANTUM_AURA_PRESET);
const [auraEmotion, setAuraEmotion] = useState<QuantumAuraEmotionId>(DEFAULT_QUANTUM_AURA_EMOTION);
const [auraIntensity, setAuraIntensity] = useState(0.72);
const [auraSpread, setAuraSpread] = useState(0.64);
const [auraDistortion, setAuraDistortion] = useState(0.78);
```

Add a third mode button near the existing generation mode controls:

```tsx
<button type="button" onClick={() => setStudioCreationMode('quantum-aura-blend')}>
  Quantum Aura Blend
</button>
```

- [ ] **Step 4: Wire the panel and composition action**

In `src/app/studio/page.tsx`, add:

```tsx
async function applyQuantumAuraBlend() {
  if (!auraSourceImageUrl) return;
  const result = await createQuantumAuraBlend({
    sourceImageUrl: auraSourceImageUrl,
    preset: auraPreset,
    emotion: auraEmotion,
    intensity: auraIntensity,
    spread: auraSpread,
    distortion: auraDistortion,
  });
  setAuraResultImageUrl(result.outputDataUrl);
}
```

Render:

```tsx
{studioCreationMode === 'quantum-aura-blend' ? (
  <QuantumAuraBlendPanel
    sourceImageUrl={auraSourceImageUrl}
    sampleImageUrl={ATTACHED_SAMPLE_IMAGE}
    preset={auraPreset}
    emotion={auraEmotion}
    intensity={auraIntensity}
    spread={auraSpread}
    distortion={auraDistortion}
    resultImageUrl={auraResultImageUrl}
    onUseSample={() => setAuraSourceImageUrl(ATTACHED_SAMPLE_IMAGE)}
    onPresetChange={setAuraPreset}
    onEmotionChange={setAuraEmotion}
    onIntensityChange={setAuraIntensity}
    onSpreadChange={setAuraSpread}
    onDistortionChange={setAuraDistortion}
    onGenerate={applyQuantumAuraBlend}
  />
) : null}
```

- [ ] **Step 5: Run the Studio tests to verify they pass**

Run: `npm test -- src/app/studio/page.test.tsx`
Expected: PASS, including the new mode and sample/demo assertions

- [ ] **Step 6: Commit**

```bash
git add src/app/studio/page.tsx src/app/studio/page.test.tsx
git commit -m "feat(studio): wire quantum aura blend mode"
```

### Task 5: Add Manual Review Polish And Final Verification

**Files:**
- Modify: `src/components/studio/QuantumAuraBlendPanel.tsx`
- Modify: `src/components/studio/QuantumAuraBlendPreview.tsx`
- Modify: `src/app/studio/page.tsx`

- [ ] **Step 1: Add explicit review labels and metadata text**

Update the panel to show:

```tsx
<div className="text-sm text-zinc-400">
  Emotional quantum aura around the subject with fractal background distortion.
</div>
<div className="text-xs text-zinc-500">
  Preset: {activePresetLabel} • Emotion: {activeEmotionLabel}
</div>
```

- [ ] **Step 2: Add safe empty states**

Add:

```tsx
{!sourceImageUrl ? (
  <div className="rounded-xl border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
    Choose the attached sample or upload a portrait to preview the effect.
  </div>
) : null}
```

- [ ] **Step 3: Run focused verification**

Run:

```bash
npm test -- src/lib/quantumAuraBlend.test.ts src/app/studio/page.test.tsx
npm run lint -- src/types/quantumAuraBlend.ts src/lib/quantumAuraBlend.ts src/lib/quantumAuraBlend.test.ts src/components/studio/QuantumAuraBlendPreview.tsx src/components/studio/QuantumAuraBlendPanel.tsx src/app/studio/page.tsx src/app/studio/page.test.tsx
npm run build
```

Expected:

- tests: PASS
- lint: 0 errors
- build: PASS

- [ ] **Step 4: Manual review checklist**

Open `/studio` and verify:

```txt
1. The new Quantum Aura Blend option is visible beside existing Studio modes.
2. Use attached sample loads the demo image immediately.
3. Neon Violet, Solar Gold, and Cosmic Rainbow all visibly change the result.
4. Calm, Charged, and Transcendent visibly change the aura energy.
5. The subject remains readable while the background distorts into fractals.
6. The layout remains usable on phone width.
```

- [ ] **Step 5: Commit**

```bash
git add src/components/studio/QuantumAuraBlendPanel.tsx src/components/studio/QuantumAuraBlendPreview.tsx src/app/studio/page.tsx
git commit -m "feat(studio): polish quantum aura blend review flow"
```

## Spec Coverage Check

- `Studio-only placement`: covered by Tasks 3 and 4
- `Built-in sample/demo`: covered by Tasks 3 and 4
- `Three color presets`: covered by Tasks 1, 3, and 4
- `Emotional Spectrum`: covered by Tasks 1, 3, and 4
- `Low-cost local pipeline`: covered by Tasks 1 and 2
- `Preview and reviewability`: covered by Tasks 3, 4, and 5
- `Focused tests and build verification`: covered by Tasks 1 through 5

## Placeholder Scan

- No `TODO`
- No `TBD`
- No unspecified file paths
- No unresolved service boundaries

## Type Consistency Check

- Preset ids are consistent across types, config, and UI: `neon-violet`, `solar-gold`, `cosmic-rainbow`
- Emotion ids are consistent across types, config, and UI: `calm`, `charged`, `transcendent`
- Composition mode is consistently `quantum-aura-blend`

