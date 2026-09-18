# Studio Fusion Shirt Composer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing `Advanced Fusion Extension` into a simple shirt-focused editor with front/back sides, person-safe abstract blending, and both auto/manual deathpunk text modes.

**Architecture:** Keep the feature inside `src/components/FusionAI.tsx` and extend the existing client-side canvas compositor instead of creating a new route or backend. Introduce a small helper module for editor defaults and phrase generation so the UI state and canvas drawing logic stay focused and testable.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library, HTML canvas

---

## File Map

- Modify: `src/components/FusionAI.tsx`
  - Add side tabs, compact editor controls, phrase-mode UI, and expanded preview composition.
- Modify: `src/components/FusionAI.test.tsx`
  - Add focused regression coverage for front/back state, phrase modes, and shirt editor actions.
- Create: `src/lib/fusion-shirt-composer.ts`
  - Hold editor types, default side settings, and deterministic phrase generation helpers.
- Create: `src/lib/fusion-shirt-composer.test.ts`
  - Cover helper defaults and phrase generation logic.
- Optional modify: `src/app/studio/page.tsx`
  - Only if a prop or label adjustment is needed to better describe the upgraded Fusion experience.

---

### Task 1: Add Shirt Composer Helper Module

**Files:**
- Create: `src/lib/fusion-shirt-composer.ts`
- Test: `src/lib/fusion-shirt-composer.test.ts`

- [ ] **Step 1: Write the failing helper tests**

```ts
import { describe, expect, it } from 'vitest';
import {
  buildDeathpunkPhrase,
  createDefaultFusionShirtState,
  createDefaultFusionSideSettings,
} from './fusion-shirt-composer';

describe('fusion shirt composer helpers', () => {
  it('creates separate defaults for front and back sides', () => {
    const state = createDefaultFusionShirtState();

    expect(state.activeSide).toBe('front');
    expect(state.front.centerProtection).toBeGreaterThan(state.back.centerProtection);
    expect(state.front.manualText).toBe('');
    expect(state.back.manualText).toBe('');
  });

  it('creates deterministic deathpunk phrases from the same prompt seed', () => {
    expect(buildDeathpunkPhrase('violet ghost')).toBe(buildDeathpunkPhrase('violet ghost'));
  });

  it('returns short clean phrases', () => {
    const phrase = buildDeathpunkPhrase('violet ghost');

    expect(phrase.length).toBeGreaterThan(0);
    expect(phrase.split(' ').length).toBeLessThanOrEqual(4);
    expect(phrase).toMatch(/^[A-Za-z ]+$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/fusion-shirt-composer.test.ts`
Expected: FAIL with module-not-found or missing export errors for `fusion-shirt-composer`.

- [ ] **Step 3: Write the minimal helper implementation**

```ts
export type FusionShirtSide = 'front' | 'back';
export type FusionPhraseMode = 'auto' | 'manual' | 'both';
export type FusionFontStyle = 'chrome-sans' | 'signal-condensed' | 'riot-mono';

export type FusionSideSettings = {
  abstractStrength: number;
  edgeFade: number;
  glow: number;
  backgroundBrightness: number;
  centerProtection: number;
  scale: number;
  verticalOffset: number;
  phraseMode: FusionPhraseMode;
  autoText: string;
  manualText: string;
  fontStyle: FusionFontStyle;
  textSize: number;
  textTracking: number;
  textOutline: number;
  textGlow: number;
  textPlacement: 'top' | 'center' | 'bottom';
};

export type FusionShirtState = {
  activeSide: FusionShirtSide;
  front: FusionSideSettings;
  back: FusionSideSettings;
};

const ADJECTIVES = ['Neon', 'Chrome', 'Future', 'Midnight', 'Static', 'Ghost'];
const NOUNS = ['Signal', 'Ritual', 'Horizon', 'Bloom', 'Circuit', 'Cathedral'];

function hashSeed(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash = (hash ^ input.charCodeAt(i)) * 16777619;
  }
  return hash >>> 0;
}

export function buildDeathpunkPhrase(prompt: string) {
  const seed = hashSeed(prompt.trim().toLowerCase() || 'deathpunk');
  const adjective = ADJECTIVES[seed % ADJECTIVES.length];
  const noun = NOUNS[Math.floor(seed / ADJECTIVES.length) % NOUNS.length];
  return `${adjective} ${noun}`;
}

export function createDefaultFusionSideSettings(side: FusionShirtSide): FusionSideSettings {
  return {
    abstractStrength: side === 'front' ? 0.58 : 0.74,
    edgeFade: 0.64,
    glow: side === 'front' ? 0.32 : 0.42,
    backgroundBrightness: 1.1,
    centerProtection: side === 'front' ? 0.84 : 0.62,
    scale: 1,
    verticalOffset: 0,
    phraseMode: 'auto',
    autoText: '',
    manualText: '',
    fontStyle: side === 'front' ? 'signal-condensed' : 'riot-mono',
    textSize: side === 'front' ? 0.14 : 0.18,
    textTracking: 0.08,
    textOutline: 0.35,
    textGlow: 0.28,
    textPlacement: side === 'front' ? 'bottom' : 'center',
  };
}

export function createDefaultFusionShirtState(): FusionShirtState {
  return {
    activeSide: 'front',
    front: createDefaultFusionSideSettings('front'),
    back: createDefaultFusionSideSettings('back'),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/fusion-shirt-composer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/fusion-shirt-composer.ts src/lib/fusion-shirt-composer.test.ts
git commit -m "feat: add fusion shirt composer helpers"
```

---

### Task 2: Add Front / Back State and Phrase Mode Controls

**Files:**
- Modify: `src/components/FusionAI.tsx`
- Test: `src/components/FusionAI.test.tsx`

- [ ] **Step 1: Write the failing component test for side switching and phrase modes**

```tsx
it('tracks independent front and back text settings', async () => {
  render(<FusionAI prompt="violet ghost" onImageGenerated={onImageGenerated} baseImageUrl="http://example.com/base.png" />);
  fireEvent.click(screen.getByText('Advanced Fusion Extension'));

  fireEvent.click(screen.getByRole('button', { name: 'Front side' }));
  fireEvent.change(screen.getByLabelText('Manual phrase'), { target: { value: 'Front Signal' } });

  fireEvent.click(screen.getByRole('button', { name: 'Back side' }));
  fireEvent.change(screen.getByLabelText('Manual phrase'), { target: { value: 'Back Ritual' } });

  fireEvent.click(screen.getByRole('button', { name: 'Front side' }));
  expect(screen.getByLabelText('Manual phrase')).toHaveValue('Front Signal');

  fireEvent.click(screen.getByRole('button', { name: 'Back side' }));
  expect(screen.getByLabelText('Manual phrase')).toHaveValue('Back Ritual');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: FAIL because `Front side`, `Back side`, or `Manual phrase` controls do not exist yet.

- [ ] **Step 3: Add minimal state and controls**

```ts
import {
  buildDeathpunkPhrase,
  createDefaultFusionShirtState,
  type FusionShirtSide,
} from '@/lib/fusion-shirt-composer';

const [shirtState, setShirtState] = useState(() => createDefaultFusionShirtState());

const activeSide = shirtState.activeSide;
const sideSettings = shirtState[activeSide];

const updateActiveSide = (nextSide: FusionShirtSide) => {
  setShirtState((prev) => ({ ...prev, activeSide: nextSide }));
};

const updateSideSettings = <K extends keyof typeof sideSettings>(key: K, value: (typeof sideSettings)[K]) => {
  setShirtState((prev) => ({
    ...prev,
    [prev.activeSide]: {
      ...prev[prev.activeSide],
      [key]: value,
    },
  }));
};
```

```tsx
<div className="grid grid-cols-2 gap-2">
  <button type="button" aria-label="Front side" aria-pressed={activeSide === 'front'} onClick={() => updateActiveSide('front')}>
    Front
  </button>
  <button type="button" aria-label="Back side" aria-pressed={activeSide === 'back'} onClick={() => updateActiveSide('back')}>
    Back
  </button>
</div>

<label className="block text-sm font-medium text-white" htmlFor="fusion-manual-phrase">
  Manual phrase
</label>
<input
  id="fusion-manual-phrase"
  aria-label="Manual phrase"
  value={sideSettings.manualText}
  onChange={(e) => updateSideSettings('manualText', e.target.value)}
  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white"
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: PASS for the new front/back state case, existing tests stay green or expose the next integration gap.

- [ ] **Step 5: Commit**

```bash
git add src/components/FusionAI.tsx src/components/FusionAI.test.tsx
git commit -m "feat: add fusion shirt front back editor state"
```

---

### Task 3: Add Auto / Manual / Both Text Controls

**Files:**
- Modify: `src/components/FusionAI.tsx`
- Test: `src/components/FusionAI.test.tsx`

- [ ] **Step 1: Write the failing test for phrase mode behavior**

```tsx
it('supports auto, manual, and both phrase modes', async () => {
  render(<FusionAI prompt="violet ghost" onImageGenerated={onImageGenerated} baseImageUrl="http://example.com/base.png" />);
  fireEvent.click(screen.getByText('Advanced Fusion Extension'));

  fireEvent.click(screen.getByRole('button', { name: 'Auto phrase mode' }));
  expect(screen.getByDisplayValue('Neon Signal')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Manual phrase mode' }));
  expect(screen.getByLabelText('Manual phrase')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Both phrase mode' }));
  expect(screen.getByText('Auto phrase')).toBeInTheDocument();
  expect(screen.getByLabelText('Manual phrase')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: FAIL because phrase mode controls and auto phrase rendering are missing.

- [ ] **Step 3: Add phrase mode controls with deterministic auto text**

```ts
useEffect(() => {
  setShirtState((prev) => ({
    ...prev,
    front: {
      ...prev.front,
      autoText: prev.front.autoText || buildDeathpunkPhrase(prompt),
    },
    back: {
      ...prev.back,
      autoText: prev.back.autoText || buildDeathpunkPhrase(`${prompt}-back`),
    },
  }));
}, [prompt]);
```

```tsx
<div className="grid grid-cols-3 gap-2">
  <button type="button" aria-label="Auto phrase mode" onClick={() => updateSideSettings('phraseMode', 'auto')}>Auto</button>
  <button type="button" aria-label="Manual phrase mode" onClick={() => updateSideSettings('phraseMode', 'manual')}>Manual</button>
  <button type="button" aria-label="Both phrase mode" onClick={() => updateSideSettings('phraseMode', 'both')}>Both</button>
</div>

{sideSettings.phraseMode !== 'manual' ? (
  <div>
    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Auto phrase</div>
    <input value={sideSettings.autoText} readOnly className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white" />
  </div>
) : null}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: PASS for the phrase mode case and existing tests remain green.

- [ ] **Step 5: Commit**

```bash
git add src/components/FusionAI.tsx src/components/FusionAI.test.tsx
git commit -m "feat: add fusion shirt phrase mode controls"
```

---

### Task 4: Expand the Canvas Pipeline for Shirt-Side Controls

**Files:**
- Modify: `src/components/FusionAI.tsx`
- Test: `src/components/FusionAI.test.tsx`

- [ ] **Step 1: Write the failing test for side-aware composition inputs**

```tsx
it('uses the active side settings when composing the preview image', async () => {
  // Set back side with stronger abstract strength and center protection changes,
  // then run fusion and assert those values affect canvas operations.
  expect(outOperations).toContainEqual(expect.objectContaining({ type: 'setAlpha', value: 0.74 }));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: FAIL because the compositor still uses hard-coded blend values.

- [ ] **Step 3: Thread active side settings into the compositor**

```ts
type FuseClientSideOptions = {
  baseImageUrl: string;
  files: File[];
  prompt: string;
  settings: FusionSideSettings;
};

const fused = await fuseClientSide({
  baseImageUrl,
  files,
  prompt,
  settings: shirtState[shirtState.activeSide],
});
```

```ts
async function fuseClientSide({ baseImageUrl, files, prompt, settings }: FuseClientSideOptions) {
  // replace hard-coded alphas and fade radii with settings.abstractStrength,
  // settings.edgeFade, settings.glow, settings.backgroundBrightness,
  // settings.centerProtection, settings.scale, settings.verticalOffset
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: PASS with updated canvas operation assertions.

- [ ] **Step 5: Commit**

```bash
git add src/components/FusionAI.tsx src/components/FusionAI.test.tsx
git commit -m "feat: add shirt side blend controls to fusion compositor"
```

---

### Task 5: Draw Text Layers into the Fusion Output

**Files:**
- Modify: `src/components/FusionAI.tsx`
- Test: `src/components/FusionAI.test.tsx`

- [ ] **Step 1: Write the failing test for text overlay rendering**

```tsx
it('renders text overlays into the fusion output', async () => {
  // configure both mode, set manual text, run fusion
  expect(outOperations).toContainEqual(expect.objectContaining({ type: 'fillText', text: 'Front Signal' }));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: FAIL because no canvas text drawing occurs yet.

- [ ] **Step 3: Add minimal text drawing support**

```ts
function getActiveTextLayers(settings: FusionSideSettings) {
  if (settings.phraseMode === 'auto') return [settings.autoText];
  if (settings.phraseMode === 'manual') return [settings.manualText];
  return [settings.autoText, settings.manualText].filter(Boolean);
}

function drawFusionText(ctx: CanvasRenderingContext2D, settings: FusionSideSettings, width: number, height: number) {
  const lines = getActiveTextLayers(settings);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `${Math.round(width * settings.textSize)}px system-ui`;
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  for (const [index, line] of lines.entries()) {
    ctx.fillText(line, width / 2, height * 0.82 + index * 42);
  }
  ctx.restore();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: PASS with text drawing assertions and previous tests still green.

- [ ] **Step 5: Commit**

```bash
git add src/components/FusionAI.tsx src/components/FusionAI.test.tsx
git commit -m "feat: draw fusion shirt text overlays"
```

---

### Task 6: Add Compact Preview and Control Polish

**Files:**
- Modify: `src/components/FusionAI.tsx`
- Test: `src/components/FusionAI.test.tsx`

- [ ] **Step 1: Write the failing UI test for editor controls**

```tsx
it('shows shirt editor controls after opening fusion', () => {
  render(<FusionAI prompt="violet ghost" onImageGenerated={onImageGenerated} baseImageUrl="http://example.com/base.png" />);
  fireEvent.click(screen.getByText('Advanced Fusion Extension'));

  expect(screen.getByText('Blend Panel')).toBeInTheDocument();
  expect(screen.getByText('Text Panel')).toBeInTheDocument();
  expect(screen.getByText('Live Preview')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: FAIL because the upgraded editor structure labels are missing.

- [ ] **Step 3: Add minimal UI structure and accessibility polish**

```tsx
<section aria-label="Blend Panel">
  <h4 className="text-sm font-semibold text-white">Blend Panel</h4>
  {/* sliders */}
</section>

<section aria-label="Text Panel">
  <h4 className="text-sm font-semibold text-white">Text Panel</h4>
  {/* phrase mode and text controls */}
</section>

<section aria-label="Live Preview">
  <h4 className="text-sm font-semibold text-white">Live Preview</h4>
  {/* active side preview */}
</section>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/FusionAI.tsx src/components/FusionAI.test.tsx
git commit -m "feat: polish fusion shirt editor layout"
```

---

### Task 7: Final Verification

**Files:**
- Verify: `src/lib/fusion-shirt-composer.ts`
- Verify: `src/lib/fusion-shirt-composer.test.ts`
- Verify: `src/components/FusionAI.tsx`
- Verify: `src/components/FusionAI.test.tsx`

- [ ] **Step 1: Run focused test suite**

Run: `npm test -- src/lib/fusion-shirt-composer.test.ts src/components/FusionAI.test.tsx`
Expected: PASS

- [ ] **Step 2: Run lint on touched files**

Run: `npx eslint src/lib/fusion-shirt-composer.ts src/lib/fusion-shirt-composer.test.ts src/components/FusionAI.tsx src/components/FusionAI.test.tsx`
Expected: 0 errors; existing non-blocking warnings are acceptable only if pre-existing and unchanged in scope.

- [ ] **Step 3: Manual verification checklist**

Run through this flow in local preview:

```text
1. Generate or load an abstract base asset in Studio.
2. Open Advanced Fusion Extension.
3. Upload a portrait-centered image.
4. Confirm Front and Back tabs keep different settings.
5. Confirm center protection keeps the person readable.
6. Confirm abstract art is stronger near shirt edges.
7. Confirm Auto, Manual, and Both phrase modes all render.
8. Confirm successful fusion still saves to the signed-in account.
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/fusion-shirt-composer.ts src/lib/fusion-shirt-composer.test.ts src/components/FusionAI.tsx src/components/FusionAI.test.tsx
git commit -m "feat: add studio fusion shirt composer"
```

---

## Self-Review

- Spec coverage:
  - compact editor inside existing Fusion: Tasks 2, 6
  - front/back state: Tasks 1, 2, 4
  - person-safe abstract blending: Task 4
  - auto/manual/both text modes: Tasks 1, 3, 5
  - futuristic phrase generation: Task 1
  - focused tests and verification: Tasks 1 through 7
- Placeholder scan:
  - Removed generic “add tests later” language and replaced it with exact files, tests, and commands.
- Type consistency:
  - Uses `FusionShirtSide`, `FusionPhraseMode`, and `FusionSideSettings` consistently across helper, UI, and compositor tasks.
