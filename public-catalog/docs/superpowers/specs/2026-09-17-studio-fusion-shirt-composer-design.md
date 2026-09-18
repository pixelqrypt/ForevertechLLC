# Studio Fusion Shirt Composer Design

## Goal

Add a simple shirt-focused editor inside the existing `Studio` and `Advanced Fusion Extension` flow so the user can:

- keep the uploaded person clear in the center
- wrap the generated abstract image across the shirt area
- edit `Front` and `Back` compositions separately
- add urban futuristic `deathpunk` wording with either auto-generated phrases, user-written phrases, or both
- adjust the blend easily without adding a costly new backend or a complex new route

The result should feel expressive, stylish, and easy to use while staying cheap to run and easy to maintain.

## Approved Direction

- Use `Option A`.
- Combine the best parts of the simple fusion upgrade and the edit panel into one compact flow.
- Keep the feature inside the existing `Studio` and `FusionAI` path.
- Make the person in the uploaded image stay readable in the center.
- Let the abstract generation fill the surrounding shirt print area.
- Add a simple `Front` / `Back` editor model.
- Support `Both` text modes:
  - auto-generated wording
  - user-typed wording
- Style text with an urban futuristic `deathpunk` direction.

## Scope

- Extend the existing `Advanced Fusion Extension` into a compact editor instead of a one-click fusion-only modal.
- Add live blend controls for person-safe abstract background wrapping.
- Add `Front` and `Back` tabs for shirt-side editing.
- Add text styling controls for:
  - phrase source
  - font family
  - size
  - glow
  - outline
  - spacing
  - placement
- Add built-in phrase generation for clean, grammatically correct futuristic expressions.
- Keep the effect local and client-side by default.
- Reuse existing `FusionAI` and current Studio preview patterns.
- Add focused tests for new controls and state behavior.

## Non-Goals

- No new standalone page or route.
- No full Photoshop-like editor.
- No production-grade subject segmentation service in this slice.
- No dependency on external paid design APIs.
- No automatic typo-filled or intentionally malformed wording.
- No full garment production-layout engine for sleeves, neck tags, or seam-specific mapping in this slice.

## Current State

`Studio` already has:

- prompt-based abstract generation
- the `FusionAI` modal for local uploaded-image fusion
- local canvas composition with center-safe fading
- merch preview flows after generation

`FusionAI` already contains:

- local canvas-based layering
- generated abstract background usage
- uploaded image overlay handling
- center fade and union blending
- signed-in save-to-account behavior

What does not yet exist:

- a simple edit-panel experience inside Fusion
- front/back shirt-side editing
- typography controls for this workflow
- curated futuristic phrase generation
- shirt-oriented placement controls tuned around a centered person

## User Experience

## Entry Point

Keep the current `Advanced Fusion Extension` button in `Studio`.

When opened, the modal becomes a compact editor rather than only an upload-and-run step.

## Editor Structure

The editor should be organized into four simple sections:

### 1. Side Tabs

- `Front`
- `Back`

Each side stores its own settings so the user can create a different composition on each side of the shirt.

### 2. Blend Panel

Controls:

- `Abstract Strength`
- `Edge Fade`
- `Glow / Shine`
- `Background Brightness`
- `Center Protection`
- `Scale`
- `Vertical Offset`

Purpose:

- keep the person visible in the center
- let the abstract art wrap around the rest of the shirt print area
- make the surrounding blend easier to tune without overcomplicating the UI

### 3. Text Panel

Modes:

- `Auto`
- `Manual`
- `Both`

Behavior:

- `Auto` generates a short clean phrase in the selected style
- `Manual` lets the user type their own phrase
- `Both` layers the generated phrase and user phrase together in a controlled layout

Controls:

- `Font Style`
- `Size`
- `Tracking`
- `Outline`
- `Glow`
- `Placement`
- `Curvature` if easy to support locally

### 4. Live Preview

The preview should show a shirt-oriented composition rather than a generic image-only preview.

It should make these things easy to see:

- the centered person
- the abstract background wrap
- the current side being edited
- the active text treatment

## Visual Behavior

## Composition Rule

The person remains the anchor.

The abstract art should mostly live:

- around the subject
- behind the subject
- toward the outer shirt print area

The abstract should not muddy the person’s face or central body area.

## Layer Order

The simplified default layer order should be:

1. generated abstract background
2. brightness / glow treatment
3. protected-person overlay
4. optional text overlays
5. front/back preview framing

This keeps the person readable while letting the abstract define the shirt.

## Center Protection

The center-safe logic should stay intentionally simple:

- use a radial or soft rectangular protection zone
- preserve the person image most strongly in the center
- allow more abstract takeover toward edges

This is not true AI segmentation. It is a cheap and fast composition rule tuned for portrait-centered uploads.

## Front / Back Model

Each shirt side should store separate editor state:

- blend settings
- text mode
- generated phrase
- manual phrase
- text placement

The default behavior:

- `Front`: stronger person focus and cleaner center protection
- `Back`: more freedom for abstract takeover and bolder text

## Text Direction

## Tone

Text should feel:

- urban
- futuristic
- sharp
- dramatic
- cleanly written

It should not feel sloppy, randomly misspelled, or incoherent.

## Font Direction

The first version should use existing web-safe or already available fonts before adding new heavy assets.

Recommended style buckets:

- `Chrome Sans`
- `Signal Condensed`
- `Riot Mono`

These are style labels in the UI. The underlying implementation can map them to available fonts and CSS treatments.

## Expression Generation

Auto-generated wording should create short phrases in a controlled tone, for example:

- `Neon Ghost Signal`
- `Deathpunk Horizon`
- `Future Static Bloom`
- `Midnight Chrome Ritual`

Rules:

- short phrase length
- correct spelling
- clean grammar where grammar applies
- high-style but readable output
- no profanity unless later explicitly requested

## Architecture

## Frontend-Only First Slice

Keep the first implementation entirely in the existing frontend.

Primary files likely affected:

- `src/components/FusionAI.tsx`
- `src/components/FusionAI.test.tsx`
- `src/app/studio/page.tsx`
- possibly small helper utilities under `src/lib/`

## State Model

Add a simple per-side editor state shape:

- active side
- side settings for `front`
- side settings for `back`

Each side should include:

- blend controls
- text controls
- phrase mode
- auto phrase
- manual phrase

This keeps front/back behavior understandable without creating a large editor framework.

## Preview Strategy

Stay with client-side canvas composition.

The preview pipeline should:

1. draw abstract background
2. apply brightness and glow adjustments
3. draw uploaded person with center-preserving mask logic
4. place text overlays
5. render the result in the existing modal preview area

## Simplicity Constraints

To keep implementation easy and budget-safe:

- avoid external APIs for blending
- avoid server-side rendering for previews
- avoid heavyweight font-loading systems in the first slice
- avoid introducing a second editor paradigm

## Error Handling

- If no abstract base image exists, keep the current message that asks the user to generate an asset first.
- If no uploaded image exists, disable shirt composition actions and explain the missing step.
- If auto text generation fails for any reason, fall back to the manual text field without blocking the editor.
- If canvas composition fails, show a clear inline error and preserve the user’s side settings.

## Testing Strategy

## Unit / Logic Coverage

Add focused tests for:

- side-state switching between `Front` and `Back`
- phrase mode behavior for `Auto`, `Manual`, and `Both`
- simple phrase-generation rules
- blend control application

## Component Coverage

Add focused tests for:

- new side tabs
- text mode controls
- live preview state changes
- save behavior not regressing after the editor expansion

## Manual Verification

Check:

- portrait image stays readable in the center
- abstract image wraps toward the shirt edges
- `Front` and `Back` states are independent
- both auto and manual phrases work
- the resulting UI still feels simple rather than overloaded

## Rollout Notes

This should ship as an upgrade to the current Fusion experience, not as a new product surface.

That keeps it:

- easier to discover
- easier to review
- easier to edit later
- cheaper than building a separate tool

## Why This Design

This design matches the user’s actual goal:

- use the existing abstract generation
- keep the person clear
- make the shirt composition feel artistic
- support front and back
- add expressive futuristic text
- keep the experience simple

It avoids overbuilding while still giving the user a meaningful editor instead of a single fused-image output.
