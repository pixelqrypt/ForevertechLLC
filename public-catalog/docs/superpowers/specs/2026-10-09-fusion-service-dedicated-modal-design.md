# Fusion Service Dedicated Modal Design

## Goal

Separate the full `Fusion` experience from the normal `Studio` generation layout so the page stays clean and the Fusion service no longer overlaps the generator UI.

The result should:

- keep the generator visible and simple on the main page
- move the full Fusion workflow into a dedicated popup modal
- preserve the current Fusion capabilities
- keep the interaction easy and visually clean

## Approved Direction

- Use a `Dedicated modal`.
- Keep `Studio` generation inline.
- Keep the `Advanced Fusion Extension` trigger button inline.
- Move the entire Fusion service into a modal overlay.
- Keep the Fusion service visually separate from generation.
- Keep the UI clean and simple.

## Scope

- Convert the current inline Fusion editor into a dedicated modal.
- Keep all Fusion controls inside that modal:
  - upload area
  - front/back tabs
  - focus controls
  - phrase mode controls
  - live preview
  - progress state
  - fusion action
  - save-to-account status
- Keep the generator on the page outside the modal.
- Keep existing generation-to-fusion handoff behavior.
- Update focused tests for the new modal behavior.

## Non-Goals

- No new route such as `/fusion`.
- No rewrite of the fusion-service logic.
- No redesign of the generator workflow.
- No additional Fusion features beyond separation and cleanup.
- No backend changes unless strictly required for existing behavior to keep working.

## Current Problem

The current Fusion service is rendered inline below the generator trigger inside `Studio`.

That causes two issues:

- the Fusion editor visually overlaps or competes with the rest of the page
- the generator and Fusion service feel merged together instead of acting like separate tools

The user wants the Fusion service to feel separate from generation while staying easy to access.

## User Experience

## Page Layout

`Studio` keeps the normal generator layout in page flow.

Visible inline Fusion surface on the page:

- one trigger button: `Advanced Fusion Extension`
- optional short saved-status message outside the modal if helpful

The large Fusion editor should no longer take space in the normal page layout.

## Modal Behavior

Clicking `Advanced Fusion Extension` opens a dedicated modal overlay.

The modal should:

- appear above the page content
- dim the background with a backdrop
- center the main Fusion shell on screen
- allow internal scrolling for tall content
- prevent page overlap with Studio controls underneath

## Modal Content

The modal contains the full Fusion service:

- title and short description
- close button
- generated asset preview when available
- shirt side controls
- blend controls
- text controls
- upload area
- uploaded preview tiles
- live preview panel
- progress bar and status
- error state
- final action button

This keeps the whole Fusion workflow in one bounded place.

## Open / Close Rules

The modal should open from the existing trigger button.

The modal should close through:

- top-right close button
- clicking the backdrop
- pressing `Escape`

The modal should not close accidentally while fusion is actively processing unless explicitly designed to allow it.

## Architecture

## Component Strategy

Keep the implementation inside `src/components/FusionAI.tsx`.

Do not split into a new route.

The main structural change is presentation:

- current inline editor container becomes a modal overlay shell
- current editor contents move inside the modal body
- current trigger button remains in normal page flow

This keeps risk lower because the existing state and fusion logic can remain in the same component.

## State Model

Keep the existing `isOpen` state, but reinterpret it as modal visibility instead of inline expansion.

Existing state for:

- uploads
- front/back settings
- focus mode
- phrase mode
- progress
- errors
- save message

should remain in place unless a small cleanup is needed for clarity.

## Layout Boundaries

The modal should have:

- backdrop layer
- fixed-position outer wrapper
- centered modal panel
- max width large enough for the two-column Fusion editor
- max height based on viewport
- overflow handling inside the panel instead of the page

This change should eliminate page overlap and click conflicts caused by the current inline layout.

## Visual Rules

- dark backdrop behind modal
- strong panel separation from page background
- keep current dark Fusion visual language
- avoid extra decorative UI
- keep headings short and clear

The overall effect should feel like a dedicated tool window, not another section of the Studio page.

## Error Handling

- Existing fusion errors stay inside the modal.
- Existing missing-input guidance stays inside the modal.
- Existing save-to-account success should remain visible after success.
- If the modal closes after successful fusion, success feedback should still be understandable to the user.

## Testing Strategy

Update focused tests to verify:

- the trigger still renders inline
- opening Fusion shows a modal-style container
- the full Fusion controls render inside the modal
- closing the modal hides the Fusion editor
- Fusion controls still work after the move
- modal interaction does not break existing Fusion logic

Manual verification should confirm:

- no inline overlap with the main Studio generator
- Fusion feels visually separate
- uploads, preview, and buttons still work
- backdrop and close behavior work

## Why This Design

This design directly solves the user’s complaint without overbuilding:

- it separates Fusion from generation
- it keeps the page clean
- it avoids creating a new route
- it preserves the current Fusion feature set
- it reduces layout overlap risk by putting Fusion into a bounded overlay

It is the fastest clean fix with the lowest structural risk.
