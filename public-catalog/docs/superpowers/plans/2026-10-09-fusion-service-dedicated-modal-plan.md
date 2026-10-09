# Fusion Service Dedicated Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the full Fusion service UI into a dedicated modal so `Studio` generation stays clean and the Fusion workflow no longer overlaps the page layout.

**Architecture:** Keep the existing Fusion logic in `src/components/FusionAI.tsx`, but change presentation from inline expansion to a modal overlay with a fixed backdrop and scrollable dialog panel. Preserve the current generator-to-fusion handoff and reuse the same state, progress, upload, and preview logic so the change stays focused on separation rather than feature churn.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library, Tailwind CSS

---

## File Map

- Modify: `src/components/FusionAI.tsx`
  - Convert the inline editor container into a dedicated modal overlay shell.
  - Add modal open/close behavior, backdrop, Escape handling, and internal scroll layout.
- Modify: `src/components/FusionAI.test.tsx`
  - Update/add regression coverage for modal open/close behavior and preserved Fusion controls.
- Optional modify: `src/app/studio/page.test.tsx`
  - Only if an existing Studio-level expectation depends on inline Fusion rendering and needs to be updated to the modal model.

---

### Task 1: Add Modal Open/Close Contract Tests

**Files:**
- Modify: `src/components/FusionAI.test.tsx`
- Test: `src/components/FusionAI.test.tsx`

- [ ] **Step 1: Write the failing test for modal visibility**

```tsx
it('opens Fusion inside a modal and hides it when closed', () => {
  render(<FusionAI prompt="test prompt" onImageGenerated={onImageGenerated} />);

  expect(screen.queryByRole('dialog', { name: /image fusion studio/i })).not.toBeInTheDocument();

  fireEvent.click(screen.getByText('Advanced Fusion Extension'));

  expect(screen.getByRole('dialog', { name: /image fusion studio/i })).toBeInTheDocument();
  expect(screen.getByText('Image Fusion Studio')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /close fusion modal/i }));

  expect(screen.queryByRole('dialog', { name: /image fusion studio/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: FAIL because the current Fusion editor is rendered inline and has no dialog role or dedicated close control.

- [ ] **Step 3: Write minimal implementation for modal semantics**

```tsx
<button
  type="button"
  aria-expanded={isOpen}
  aria-haspopup="dialog"
  aria-controls={editorPanelId}
  onClick={() => !isFusing && setIsOpen(true)}
>
  Advanced Fusion Extension
</button>

{isOpen ? (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
    <div
      id={editorPanelId}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fusion-modal-title"
      className="w-full max-w-6xl overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-4 sm:px-6">
        <h3 id="fusion-modal-title" className="text-lg font-bold text-white sm:text-xl">
          Image Fusion Studio
        </h3>
        <button
          type="button"
          aria-label="Close fusion modal"
          onClick={() => !isFusing && setIsOpen(false)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-blue-500/40 hover:text-white"
        >
          <X className="h-4 w-4" />
          Close
        </button>
      </div>
      {/* existing Fusion editor content */}
    </div>
  </div>
) : null}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: PASS for the new modal visibility case.

- [ ] **Step 5: Commit**

```bash
git add src/components/FusionAI.tsx src/components/FusionAI.test.tsx
git commit -m "feat: open fusion service in modal"
```

---

### Task 2: Move Inline Editor Layout Into Modal Body

**Files:**
- Modify: `src/components/FusionAI.tsx`
- Test: `src/components/FusionAI.test.tsx`

- [ ] **Step 1: Write the failing test that the Fusion editor is no longer inline**

```tsx
it('keeps only the trigger inline until the modal opens', () => {
  render(<FusionAI prompt="violet ghost" onImageGenerated={onImageGenerated} baseImageUrl="http://example.com/base.png" />);

  expect(screen.queryByText('Blend Panel')).not.toBeInTheDocument();
  expect(screen.queryByText('Text Panel')).not.toBeInTheDocument();

  fireEvent.click(screen.getByText('Advanced Fusion Extension'));

  expect(screen.getByText('Blend Panel')).toBeInTheDocument();
  expect(screen.getByText('Text Panel')).toBeInTheDocument();
  expect(screen.getByText('Live Preview')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: FAIL if any editor sections still render in normal page flow before opening the modal.

- [ ] **Step 3: Move the existing editor grid into a scrollable modal body**

```tsx
{isOpen ? (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
    <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
      <div className="shrink-0 border-b border-gray-800 px-4 py-4 sm:px-6">
        {/* header */}
      </div>

      <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          {/* existing Fusion editor sections */}
        </div>
      </div>
    </div>
  </div>
) : null}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: PASS with the editor panels visible only after opening the modal.

- [ ] **Step 5: Commit**

```bash
git add src/components/FusionAI.tsx src/components/FusionAI.test.tsx
git commit -m "refactor: move fusion editor into modal body"
```

---

### Task 3: Add Backdrop Close and Escape Key Behavior

**Files:**
- Modify: `src/components/FusionAI.tsx`
- Modify: `src/components/FusionAI.test.tsx`

- [ ] **Step 1: Write the failing test for backdrop and Escape closing**

```tsx
it('closes the Fusion modal on Escape and backdrop click when idle', () => {
  render(<FusionAI prompt="test prompt" onImageGenerated={onImageGenerated} />);
  fireEvent.click(screen.getByText('Advanced Fusion Extension'));

  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog', { name: /image fusion studio/i })).not.toBeInTheDocument();

  fireEvent.click(screen.getByText('Advanced Fusion Extension'));
  fireEvent.click(screen.getByTestId('fusion-modal-backdrop'));
  expect(screen.queryByRole('dialog', { name: /image fusion studio/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: FAIL because the current modal shell does not yet close on Escape or backdrop click.

- [ ] **Step 3: Add minimal close handlers**

```tsx
useEffect(() => {
  if (!isOpen) return;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !isFusing) {
      setIsOpen(false);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isOpen, isFusing]);
```

```tsx
<div
  data-testid="fusion-modal-backdrop"
  className="fixed inset-0 z-[90] bg-black/70"
  onClick={() => {
    if (!isFusing) setIsOpen(false);
  }}
/>
<div className="fixed inset-0 z-[91] flex items-center justify-center p-4">
  <div onClick={(event) => event.stopPropagation()}>
    {/* modal panel */}
  </div>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: PASS for Escape and backdrop close behavior.

- [ ] **Step 5: Commit**

```bash
git add src/components/FusionAI.tsx src/components/FusionAI.test.tsx
git commit -m "feat: add fusion modal close behavior"
```

---

### Task 4: Protect Active Processing State

**Files:**
- Modify: `src/components/FusionAI.tsx`
- Modify: `src/components/FusionAI.test.tsx`

- [ ] **Step 1: Write the failing test for close protection while fusing**

```tsx
it('does not close the modal while fusion is actively processing', async () => {
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
    if (url.startsWith('/api/fuse')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ jobId: 'test-job-123' }) } as Response);
    }
    return Promise.resolve({ ok: false, status: 500 } as Response);
  });

  render(<FusionAI prompt="a valid prompt" onImageGenerated={onImageGenerated} baseImageUrl="http://example.com/base.png" />);
  fireEvent.click(screen.getByText('Advanced Fusion Extension'));

  const file = new File(['x'], 'test.png', { type: 'image/png' });
  fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } });
  fireEvent.click(screen.getByText(/Fuse 1 Image with Prompt/i));

  fireEvent.click(screen.getByRole('button', { name: /close fusion modal/i }));

  expect(screen.getByRole('dialog', { name: /image fusion studio/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: FAIL if the modal still closes while `isFusing` is true.

- [ ] **Step 3: Keep existing close guards consistent**

```tsx
onClick={() => {
  if (!isFusing) setIsOpen(false);
}}
```

```tsx
onClick={() => !isFusing && setIsOpen(true)}
```

```tsx
onClick={() => {
  if (!isFusing) setIsOpen(false);
}}
```

Ensure the trigger, backdrop, close button, and Escape key all respect the same `isFusing` guard.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/FusionAI.test.tsx`
Expected: PASS with the modal staying open during active fusion.

- [ ] **Step 5: Commit**

```bash
git add src/components/FusionAI.tsx src/components/FusionAI.test.tsx
git commit -m "fix: guard fusion modal close while processing"
```

---

### Task 5: Verify Studio-Level Integration Still Works

**Files:**
- Modify: `src/app/studio/page.test.tsx` (only if needed)
- Test: `src/components/FusionAI.test.tsx`
- Test: `src/app/studio/page.test.tsx`

- [ ] **Step 1: Write or update the failing Studio-level expectation if needed**

```tsx
it('keeps the advanced fusion trigger visible without rendering the full editor inline', async () => {
  await renderStudioPage();
  expect(screen.getByText('Advanced Fusion Extension')).toBeInTheDocument();
  expect(screen.queryByText('Image Fusion Studio')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails if Studio assumptions are stale**

Run: `npm test -- src/app/studio/page.test.tsx`
Expected: FAIL only if the existing Studio tests still assume inline Fusion content.

- [ ] **Step 3: Make the minimal Studio test adjustment**

```tsx
expect(screen.getByText('Advanced Fusion Extension')).toBeInTheDocument();
expect(screen.queryByText('Blend Panel')).not.toBeInTheDocument();
```

Only update Studio tests if the modal move changes page-level expectations.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/FusionAI.test.tsx src/app/studio/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/FusionAI.test.tsx src/app/studio/page.test.tsx
git commit -m "test: align studio expectations with fusion modal"
```

---

### Task 6: Final Verification

**Files:**
- Verify: `src/components/FusionAI.tsx`
- Verify: `src/components/FusionAI.test.tsx`
- Verify: `src/app/studio/page.test.tsx`

- [ ] **Step 1: Run focused tests**

Run: `npm test -- src/components/FusionAI.test.tsx src/app/studio/page.test.tsx`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Run lint on touched files**

Run: `npx eslint src/components/FusionAI.tsx src/components/FusionAI.test.tsx src/app/studio/page.test.tsx`
Expected: 0 errors; existing warnings are acceptable only if pre-existing and unchanged.

- [ ] **Step 4: Manual verification checklist**

Confirm:

```text
1. Studio page stays clean after load.
2. Only the Fusion trigger shows inline.
3. Clicking Advanced Fusion Extension opens the modal.
4. Front/Back, focus, phrase modes, uploads, and preview still work.
5. Backdrop and Escape close the modal when idle.
6. The modal does not close during active fusion.
7. No Fusion editor block overlaps the main generator layout.
```

- [ ] **Step 5: Commit**

```bash
git add src/components/FusionAI.tsx src/components/FusionAI.test.tsx src/app/studio/page.test.tsx
git commit -m "feat: separate fusion service into dedicated modal"
```

---

## Self-Review

- Spec coverage:
  - generator remains clean inline: Tasks 1, 2, 5
  - full Fusion service moves into a modal: Tasks 1, 2
  - backdrop, close button, Escape: Task 3
  - do not accidentally close during active processing: Task 4
  - preserve existing Fusion behavior and tests: Tasks 4, 5, 6
- Placeholder scan:
  - No `TBD`, `TODO`, or vague “add tests later” placeholders remain.
- Type consistency:
  - Reuses existing `isOpen`, `isFusing`, `editorPanelId`, and Fusion button labels consistently across tasks.
