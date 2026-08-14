# Marketplace Public Storefront Design

## Goal

Add a new public `Marketplace` page and top-level navigation entry that separates public sale-ready assets from the current private `My Gallery` experience.

The new page should:

- lead with assets available for sale
- explain the value difference between `Standard Generation` and `Real Quantum Generation`
- show the best public gallery work in a premium storefront layout
- include sign-up cards and creator sections as supporting social proof
- allow creators to control public versus private visibility from both `Studio` and `My Gallery`

## Approved Direction

- Keep `/gallery` as the personal `My Gallery` route.
- Add a new top-nav page named `Marketplace`.
- Use a `For Sale First` public storefront layout.
- Keep an editorial premium feel instead of a plain product grid.
- Add a side-by-side `Standard Generation` versus `Real Quantum Generation` comparison with arrows showing the steps as a sales pitch.
- Show `Everything Public`, but only for assets intentionally marked public by the creator.
- Keep sign-up cards on the page.
- Add privacy controls in both `Studio` and `My Gallery`.

## Scope

- Add a new public marketplace route and navigation entry.
- Build a new page composition for public sale-ready assets.
- Introduce public/private visibility state for generated assets.
- Expose visibility controls in `Studio` when saving or publishing a generated asset.
- Expose visibility controls in `My Gallery` for later changes.
- Add public marketplace sections for:
  - hero
  - quantum comparison
  - latest public assets for sale
  - featured creators
  - latest sign-ups
  - latest active creators
- Add or update focused tests for navigation, public filtering, and visibility controls.

## Non-Goals

- No replacement of the current checkout architecture.
- No removal of the existing `My Gallery` page.
- No full redesign of the rest of the site outside the new marketplace slice and related visibility controls.
- No new creator ranking or recommendation engine beyond lightweight derived sections from current data.
- No attempt to solve unrelated auth, admin, or storage issues in this slice.

## Current State

### Gallery

`/gallery` currently behaves as a personal gallery. It filters items down to the current user or current device and is therefore not a strong fit for a public storefront.

The current page mixes:

- personal saved generations
- favorites
- PixelQrypt verified items
- creator upgrade and payout state
- merch preview actions

That is useful for the owner of the assets, but it is not the right browsing model for a public sales page.

### Public Sale Discovery

There is no dedicated route today that answers:

- what is currently available to buy
- which creations are public
- which creators are active
- what makes the paid quantum path better than standard generation

### Visibility Model

Gallery items do not currently have a first-class public/private visibility contract. Public marketplace browsing therefore needs a dedicated visibility field and filtering rule before it can be trustworthy.

## Design Principles

### 1. Separate Private Ownership From Public Commerce

`My Gallery` is for the creator. `Marketplace` is for the buyer and public browser.

These routes should not compete or blur audience.

### 2. Commerce Leads, Social Proof Supports

The page should open with sale-ready assets and a clear product story. Sign-up cards and creator sections should help trust and momentum, but they should not outrank the actual work for sale.

### 3. Public Means Intentional

An asset appears in the public marketplace only when the creator has explicitly left it public.

### 4. Quantum Must Sell Visibly

The public page should not merely mention quantum generation. It should visually compare the standard path and the real quantum path so the premium difference feels concrete.

### 5. Reuse Existing Asset And Commerce Actions

Where possible, the new marketplace cards should reuse the same proven action vocabulary:

- `Preview`
- `Customize`
- `Purchase`
- `Share`

## Proposed Product Structure

## Navigation

Add `Marketplace` to the primary header navigation on desktop and mobile.

Navigation intent after this change:

- `Studio` = create
- `Marketplace` = browse public items for sale
- `Gallery` = manage my saved/private items

This resolves the current ambiguity where `Gallery` tries to serve personal browsing and public storefront expectations at the same time.

## Marketplace Page

Create a new route:

- `src/app/marketplace/page.tsx`

### Section 1: Premium Hero

The hero should frame the page as a premium public storefront for PixelQrypt creations.

Content goals:

- explain that these are live generated assets available for sale
- direct users into browsing immediately
- reinforce `PixelQrypt by ForeverTech LLC`

Primary hero actions:

- browse public assets
- start creating in Studio

### Section 2: Quantum Versus Standard Comparison

This section is both educational and commercial.

Layout:

- two side-by-side panels
- left panel: `Standard Generation`
- right panel: `Real Quantum Generation`
- arrow-driven step row under or within each panel

Proposed step flow:

Standard:

1. `Write Prompt`
2. `Render Standard Asset`
3. `Preview On Product`
4. `Purchase`

Real Quantum:

1. `Write Prompt`
2. `Unlock Quantum Session`
3. `Render Verified Asset`
4. `Preview Premium Result`
5. `Purchase`

The quantum side should visually feel rarer, more verified, and more premium. The standard side should still look good, but clearly more baseline.

### Section 3: Latest Public Assets For Sale

This is the main commercial surface.

Rules:

- show all public assets available for sale
- sort newest first by default
- keep cards visually clean and image-led
- show creator name, prompt excerpt, and price/action row
- include existing high-value actions such as preview, customize, and purchase

Marketplace cards should not inherit every private-gallery affordance. Personal management actions like favorite toggles or creator-only management controls should stay out of the public storefront card by default unless there is a strong public reason to keep them.

### Section 4: Featured Creators

This is a curated-looking section built from current available creator signals, not a separate editorial CMS.

It should highlight creators with public sale-ready work and present them as storefront personalities, not as internal account records.

The section should answer:

- who is making the work
- who has public collections live
- why buyers should trust the marketplace has active creators

### Section 5: Latest Sign-Ups

Keep the sign-up cards, but place them below the primary asset grid.

Purpose:

- show marketplace momentum
- signal that new people are joining
- make the product feel active and alive

Rules:

- lighter visual weight than product cards
- no interruption of the main browsing flow
- present as supporting social proof, not primary merchandise

### Section 6: Latest Active Creators

This section should show recent public sellers or creators who recently published public work.

It complements the sign-up cards by proving that the marketplace is not only growing, but also shipping public work.

### Section 7: Creator CTA

Close the page with a call to action that connects creation and commerce:

- start in Studio
- publish a public asset
- upgrade into real quantum generation

## Visibility Model

Introduce a first-class visibility field for gallery/marketplace items.

Recommended contract:

- `visibility: 'public' | 'private'`

Default behavior:

- default new marketplace-eligible assets to `public`, because the approved direction is everything public with the option to make it private
- the UI must make this state clear before save/publish

Control points:

- `Studio`: choose visibility before saving/publishing the generated asset
- `My Gallery`: change visibility later on any saved item

Public marketplace inclusion rule:

- include item only when `visibility === 'public'`

Private override rule:

- once a creator changes an item to private, it should no longer appear in Marketplace

## Data Model And Route Changes

### Gallery Item Shape

Extend gallery item storage with visibility and sale-readiness fields needed by Marketplace.

Minimum new field:

- `visibility`

Optional lightweight derived fields if needed for page composition:

- `isForSale`
- `publishedAt`

The implementation should prefer the smallest data shape that supports:

- public filtering
- newest sorting
- creator sections
- sale availability checks

### API

Current gallery APIs can remain the source of item storage, but they need to support public filtering and visibility updates.

Likely additions:

- extend `GET /api/gallery` to support a public marketplace mode or add a dedicated marketplace route
- add a visibility update endpoint for creator-owned items if current favorite route patterns are reused

Recommended approach:

- create a dedicated public marketplace read route instead of overloading the current personal gallery read path

That keeps the audience separation clear:

- personal gallery API for owner views
- marketplace API for public views

## Component Strategy

Prefer extracting dedicated marketplace presentation components instead of growing `gallery/page.tsx` into another mixed-audience page.

Recommended pieces:

- marketplace hero section
- quantum comparison section
- marketplace asset card/grid
- featured creators strip
- sign-up cards section
- active creators section

Shared card actions may reuse existing gallery/customize/cart logic where appropriate, but public-storefront presentation should be intentionally slimmer than owner-facing gallery presentation.

## Error Handling

Marketplace should fail gracefully:

- if public assets fail to load, show a premium empty/error state with retry
- if creator/sign-up sections fail, the asset grid should still render
- if no public assets exist yet, show a strong first-publish CTA rather than a broken page

Visibility updates should:

- optimistically update in owner-facing UI if already used elsewhere
- revert on failure
- clearly confirm whether an item is public or private

## Testing

Add focused tests for:

- header includes `Marketplace`
- marketplace route renders the approved section order
- public marketplace data excludes private items
- `Studio` visibility control sends the expected public/private state on save
- `My Gallery` visibility control updates existing items
- public marketplace cards show purchase-oriented actions without leaking owner-only controls
- quantum comparison section renders the side-by-side standard versus quantum sales pitch

## Risks

### Mixed Audience Drift

If the public page reuses too much of the private gallery UI, the new route will feel like another internal tool surface.

Mitigation:

- keep owner controls in `My Gallery`
- make Marketplace cards purpose-built for public shopping

### Visibility Confusion

If creators cannot tell whether an item is public, trust in the marketplace will drop.

Mitigation:

- make visibility explicit in Studio
- add clear public/private badges or control copy in My Gallery

### Sparse Social Sections

If sign-up or creator data is weak, those sections can feel empty or artificial.

Mitigation:

- allow graceful section fallback copy
- avoid making social-proof sections dominate page height

## Acceptance Criteria

- A new public `Marketplace` page exists and is linked from the primary navigation.
- `/gallery` remains the personal `My Gallery` experience.
- Marketplace leads with sale-ready public assets.
- Marketplace includes a side-by-side `Standard Generation` versus `Real Quantum Generation` comparison with step arrows.
- Marketplace includes sign-up cards, featured creators, and latest active creators as secondary supporting sections.
- Only public items appear in Marketplace.
- Creators can control visibility from both `Studio` and `My Gallery`.
- The new route feels like a premium public storefront rather than a personal management page.
