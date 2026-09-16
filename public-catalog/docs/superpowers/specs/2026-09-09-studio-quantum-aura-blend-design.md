# Studio Quantum Aura Blend Design

## Goal

Add a new `Quantum Aura Blend` mode to the existing `Studio` page so the user can apply a portrait-focused hybrid effect to an uploaded image.

The effect should:

- keep the person readable in the foreground
- generate a colorful emotional quantum aura around the subject
- distort the background into fractal field patterns
- provide a built-in sample/demo using the user-supplied reference image
- stay cheap to run by default, starting with local client-side composition before any optional paid generation work

## Approved Direction

- Add the feature inside the existing `Studio` page instead of creating `studio2`.
- Build `Option 2`: Studio integration plus an in-page sample/demo panel.
- Use a single `Hybrid` effect direction:
  - emotional quantum aura around the subject
  - colorful aura field
  - fractalized background distortion
- Add `3` selectable color presets:
  - `Neon Violet`
  - `Solar Gold`
  - `Cosmic Rainbow`
- Add an `Emotional Spectrum` control that changes how the aura behaves, not only how it looks.
- Optimize for the easiest successful build and easiest future editing.
- Keep runtime cost under the requested budget by preferring local compositing first and avoiding unnecessary paid generation calls.

## Scope

- Extend `Studio` with a new `Quantum Aura Blend` mode.
- Add a new portrait/aura effect section in the current Studio workflow.
- Add a built-in sample/demo card using the attached image as the initial preview asset.
- Add `3` aura color presets.
- Add an `Emotional Spectrum` selector with at least `Calm`, `Charged`, and `Transcendent`.
- Build a local client-side effect pipeline that:
  - approximates subject-centered aura composition
  - pushes the background into abstract/fractal distortion
  - layers glow and emotional color energy around the subject
- Reuse existing canvas blend and Studio UI patterns wherever possible.
- Add focused tests for the new mode, controls, and sample/demo behavior.

## Non-Goals

- No new `studio2` route in this slice.
- No production-grade human segmentation service in the first implementation.
- No expensive always-on paid image generation for every preview change.
- No new backend service for this first version.
- No attempt to fully solve high-accuracy person matting across all image types in the first milestone.
- No automatic background removal API that requires new external credentials before the UI can ship.

## Current State

### Studio

`/studio` is already the main creation workflow. It contains:

- prompt-driven image generation
- standard versus real quantum generation modes
- local state for generated art, previews, and save flows
- a `FusionAI` component for local client-side canvas blending
- merch preview and publish-oriented controls

Relevant files:

- `src/app/studio/page.tsx`
- `src/components/FusionAI.tsx`
- `src/app/api/generate/image/route.ts`

### Existing Blend Capability

The repo already contains useful ingredients for the new effect:

- canvas blend modes and local fusion logic in `src/components/FusionAI.tsx`
- quantum/fractal styling direction in the current Studio and image-generation stack
- layered image compositing patterns in the auxiliary `fusion-service`

What does not currently exist in the main app:

- a first-class portrait aura workflow
- person-aware aura controls in Studio
- a sample/demo slice for this effect
- explicit emotional-spectrum controls

## Design Principles

### 1. Keep Studio Canonical

The new effect belongs inside `Studio`, because that is already the site’s creation surface. This keeps the feature easier to discover, easier to maintain, and cheaper to implement than a parallel `studio2` route.

### 2. Cheap First, Fancy Second

The first implementation should be designed to succeed using local canvas composition. The effect should feel premium before any optional future backend segmentation or paid generation steps are introduced.

### 3. Readable Subject, Transformative Background

The user’s image should still clearly show the person. The background should carry most of the fractal distortion and field takeover. The aura should wrap around the subject rather than cover the face or body completely.

### 4. Emotion Drives Energy

The `Emotional Spectrum` should change aura behavior:

- spread
- intensity
- glow sharpness
- fractal turbulence
- color energy transitions

This should feel meaningfully different from merely choosing a palette.

### 5. Reviewability Matters

The feature should include an in-page demo so reviewers can understand the intended effect immediately, even before uploading their own image.

## User Experience

## Entry Point

Add a new creation mode card or toggle within the existing Studio generator area:

- `Standard Generation`
- `Real Quantum Generation`
- `Quantum Aura Blend`

`Quantum Aura Blend` should open a tailored section for portrait-based effect creation.

## Aura Blend Workspace

The new mode should show:

- image source selector
  - `Use attached sample`
  - `Upload portrait`
- preset selector
  - `Neon Violet`
  - `Solar Gold`
  - `Cosmic Rainbow`
- emotional spectrum selector
  - `Calm`
  - `Charged`
  - `Transcendent`
- intensity slider
- fractal distortion slider
- aura spread slider
- preview panel with:
  - original image
  - processed result
  - applied preset and emotional state summary

## Sample Demo

The page should include a preloaded sample block that uses the user-supplied attached image as the first demo asset.

Purpose:

- show the effect immediately for review
- make the feature understandable without setup friction
- allow design iteration even before upload flows are heavily refined

## Effect Behavior

The resulting composition should visually do all of the following:

- preserve a readable central subject
- create a colorful quantum aura around the subject’s body
- express the chosen emotional state through glow density, bloom, and turbulence
- distort the surrounding environment into fractal field patterns
- feel cinematic and controlled rather than noisy or chaotic

## Presets

### Neon Violet

- dominant palette: violet, indigo, electric blue
- emotional feel: introspective, high-frequency, futuristic
- best for a cooler quantum-field aesthetic

### Solar Gold

- dominant palette: amber, gold, warm orange
- emotional feel: radiant, powerful, uplifting
- best for a luminous aura with warmer bloom

### Cosmic Rainbow

- dominant palette: multicolor spectral gradients
- emotional feel: expansive, transcendent, surreal
- best for the most dramatic field transformation

## Emotional Spectrum

### Calm

- softer aura edge
- wider low-intensity glow
- smoother fractal distortion
- lower contrast in the background transformation

### Charged

- brighter edge bloom
- sharper color transitions
- more visible energy lines and field ripples
- stronger separation between subject and background

### Transcendent

- richest multistage aura
- strongest background fractal takeover
- highest bloom and spectral spread
- most cinematic and stylized output

## Architecture

### Frontend-Only First Milestone

Implement the first version fully inside the existing Next.js frontend.

Responsibilities:

- manage uploaded or sample image state
- apply local canvas-based hybrid composition
- render side-by-side preview
- expose preset and emotional-spectrum controls
- save or export the processed result through existing Studio patterns where appropriate

### No New Service Requirement

The cheapest and fastest successful implementation is to avoid adding a backend service for the first milestone.

This means:

- no new external segmentation provider
- no new paid effect-generation loop
- no new long-running image-processing backend

## Technical Approach

## Recommended Implementation Strategy

Use a `local compositing pipeline` in the browser based on canvas.

### Core Steps

1. Load the source image into canvas.
2. Approximate subject emphasis using a centered portrait-safe mask strategy for the first milestone.
3. Build an outer aura region around the subject-safe area.
4. Render preset-driven color gradients and noise-based energy textures into the aura region.
5. Apply fractal-like background distortion outside the subject-safe core.
6. Composite the clean subject region above the aura and distorted background.
7. Export the result as a PNG data URL or blob for preview and potential save flow reuse.

### Why This Approach

- cheapest runtime path
- easiest to edit later
- no new credentials
- no uncertain third-party latency
- directly reuses current client-side image composition patterns

### Important Limitation

The first milestone should be explicit that it uses `portrait-safe approximation`, not true AI person segmentation.

That is acceptable for the first version because:

- the user asked for the easiest successful build
- cost control matters
- the effect can still look compelling on the provided sample and similar portrait images

## Future Upgrade Path

If later needed, a second milestone can add optional high-accuracy subject extraction using a backend or model-based service. That should be layered behind the same frontend controls so the user-facing design stays stable.

## File Structure

### Modify

- `src/app/studio/page.tsx`
  - add new mode selection
  - add new aura blend workspace
  - add sample/demo integration
- `src/app/studio/page.test.tsx`
  - cover new controls and sample flow
- `src/components/FusionAI.tsx`
  - either extend reusable local blend utilities or extract shared composition helpers

### Create

- `src/components/studio/QuantumAuraBlendPanel.tsx`
  - main UI for uploaded image, preset controls, emotional spectrum, and preview
- `src/components/studio/QuantumAuraBlendPreview.tsx`
  - side-by-side or result-focused preview surface
- `src/lib/quantumAuraBlend.ts`
  - local composition pipeline
- `src/lib/quantumAuraBlend.test.ts`
  - unit tests for preset/effect derivation logic
- `src/types/quantumAuraBlend.ts`
  - shared types for presets, emotional states, and result parameters

### Optional Asset Handling

If needed for reviewability and easier testing:

- `public/images/studio-quantum-aura-sample.png`

If the uploaded image cannot be committed directly, use a local test fixture or keep it as a temporary development asset only.

## Data and State Model

### Effect Preset

Fields:

- `id`
- `label`
- `primaryColors`
- `glowColor`
- `noiseSeedHint`
- `backgroundDistortionBias`

### Emotional State

Fields:

- `id`
- `label`
- `glowIntensity`
- `auraSpread`
- `fractalTurbulence`
- `subjectClarity`

### Blend Request

Fields:

- `sourceImage`
- `preset`
- `emotion`
- `intensity`
- `spread`
- `distortion`

### Blend Result

Fields:

- `outputDataUrl`
- `metadata`
  - preset
  - emotion
  - generationTimestamp
  - compositionMode

## Cost Strategy

The user asked to begin near `$3` and stay under `$10` credit usage.

The first milestone should therefore use this strategy:

- default to local canvas composition
- do not send every adjustment through a paid image model
- use existing uploaded/sample image as the base
- only consider optional paid generation later for premium enhancement modes

Expected effect on cost:

- local preview iteration should cost `$0` in model credits
- any optional later premium enhancement should be clearly separated behind an explicit user action

## Error Handling

- If image loading fails, show a clear retry state.
- If canvas composition fails, preserve the original uploaded image and show a friendly local-processing error.
- If the sample asset cannot load, keep the workspace usable with upload-only mode.
- If the browser lacks required canvas support, show a compatibility notice instead of a broken preview.

## Testing Strategy

### Unit Tests

Add focused tests for:

- preset-to-style mapping
- emotional-spectrum parameter mapping
- safe default blend settings
- metadata generation

### Component Tests

Add focused tests for:

- `Quantum Aura Blend` mode toggle rendering in Studio
- `3` color preset buttons
- emotional-spectrum control
- sample/demo rendering
- upload flow wiring

### Manual Verification

Before claiming success:

- open Studio on desktop
- switch into `Quantum Aura Blend`
- verify sample image loads
- verify all three color presets update the preview state
- verify emotional-spectrum changes alter preview styling
- verify the original subject remains readable
- verify the background becomes visibly fractalized
- verify the page remains usable on phone-sized layout

## Success Criteria

This design is successful when:

- the user can open `Studio` and find the new mode quickly
- the built-in sample demonstrates the intended effect clearly
- the effect feels like a colorful quantum emotional aura around the person
- the background visibly distorts into fractal field patterns
- the implementation stays cheap and easy to edit
- the first version ships without requiring new backend services or expensive model loops

## Why This Design

This approach gives the user the fastest path to a successful result:

- it lives in the right place
- it is easy to review
- it is inexpensive to run
- it is easy for future AI or human editing
- it creates a strong visual effect without overcommitting to costly infrastructure too early

It also keeps the door open for a later upgrade to better subject extraction without forcing that complexity into the first shipping milestone.
