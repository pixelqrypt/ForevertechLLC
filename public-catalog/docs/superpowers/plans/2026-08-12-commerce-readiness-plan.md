# Commerce Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the customer-facing commerce sweep so `PixelQrypt by ForeverTech LLC` feels consistent and all live purchase paths are brand-aligned, reachable, and checkout-ready.

**Architecture:** Keep the existing Next.js storefront structure, extend the new shared brand and checkout runtime helpers, and close the remaining gaps by hardening cart, gallery, customizer, PixelQrypt, and Premium Creator flows. Use focused route/component tests for fast confidence and one end-to-end pass to prove the customer journey still works.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Playwright, Stripe Checkout

---

### Task 1: Finish Shared Brand Alignment

**Files:**
- Modify: `src/app/manifest.ts`
- Modify: `src/app/gallery/page.tsx`
- Modify: `src/app/pixelqrypt/page.tsx`
- Modify: `src/components/CatalogItem.tsx`
- Modify: `src/components/ProductCustomizer.tsx`
- Test: `src/app/layout.metadata.test.ts`
- Test: `src/app/pixelqrypt/page.test.tsx`

- [ ] **Step 1: Write the failing metadata and purchase-copy tests**

```ts
it('uses PixelQrypt as the installable app name', () => {
  expect(manifest.name).toBe('PixelQrypt');
  expect(manifest.short_name).toBe('PixelQrypt');
});

it('shows PixelQrypt by ForeverTech LLC in the PixelQrypt purchase support copy', async () => {
  render(<PixelQryptPage />);
  expect(await screen.findByText(/PixelQrypt by ForeverTech LLC/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/layout.metadata.test.ts src/app/pixelqrypt/page.test.tsx`

Expected: FAIL because the manifest and PixelQrypt purchase surface still use older or partial brand text.

- [ ] **Step 3: Update the manifest and customer purchase copy**

```ts
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PixelQrypt',
    short_name: 'PixelQrypt',
    description: 'PixelQrypt by ForeverTech LLC creates premium fractal apparel and digital purchase experiences.',
  };
}
```

```tsx
<div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-xs text-zinc-300">
  Download access for PixelQrypt by ForeverTech LLC is delivered instantly after a successful payment.
</div>
```

- [ ] **Step 4: Update gallery/customizer/catalog microcopy to the same hierarchy**

```tsx
const shareLabel = `Created with PixelQrypt by ForeverTech LLC`;
const supportLabel = 'Support from ForeverTech LLC';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/app/layout.metadata.test.ts src/app/pixelqrypt/page.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/manifest.ts src/app/gallery/page.tsx src/app/pixelqrypt/page.tsx src/components/CatalogItem.tsx src/components/ProductCustomizer.tsx src/app/layout.metadata.test.ts src/app/pixelqrypt/page.test.tsx
git commit -m "feat: finish pixelqrypt brand alignment"
```

### Task 2: Polish Cart And Checkout Trust Surfaces

**Files:**
- Modify: `src/app/cart/page.tsx`
- Modify: `src/app/checkout/page.tsx`
- Modify: `src/components/Header.tsx`
- Test: `src/app/checkout/page.test.tsx`
- Test: `tests/e2e/customer.journey.spec.ts`

- [ ] **Step 1: Write the failing checkout/cart trust tests**

```ts
it('shows PixelQrypt by ForeverTech LLC in the cart summary area', async () => {
  render(<CartPage />);
  expect(await screen.findByText(/PixelQrypt by ForeverTech LLC/i)).toBeInTheDocument();
});

it('keeps the checkout CTA reachable and branded on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/checkout');
  await expect(page.getByTestId('submit-payment')).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/checkout/page.test.tsx`

Run: `npx playwright test tests/e2e/customer.journey.spec.ts --grep "guest checkout"`

Expected: FAIL because the cart summary currently lacks the shared trust line and the mobile flow has not been explicitly asserted.

- [ ] **Step 3: Add a consistent trust line and cart reassurance copy**

```tsx
<div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-300">
  PixelQrypt by ForeverTech LLC uses secure Stripe checkout and made-to-order fulfillment.
</div>
```

```tsx
<p className="text-xs text-zinc-500">
  Need help before ordering? Visit Shipping, Refunds, or Support.
</p>
```

- [ ] **Step 4: Make the cart image surface and summary safer for broken assets**

```tsx
{item.imageUrl ? (
  <Image
    src={item.imageUrl}
    alt={item.title}
    fill
    sizes="96px"
    className="object-cover"
  />
) : (
  <FallbackCartThumb />
)}
```

- [ ] **Step 5: Run tests to verify it passes**

Run: `npm test -- src/app/checkout/page.test.tsx`

Run: `npx playwright test tests/e2e/customer.journey.spec.ts --grep "cart operations|guest checkout"`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/cart/page.tsx src/app/checkout/page.tsx src/components/Header.tsx src/app/checkout/page.test.tsx tests/e2e/customer.journey.spec.ts
git commit -m "feat: polish cart and checkout trust surfaces"
```

### Task 3: Harden Direct Purchase Routes

**Files:**
- Modify: `src/app/api/checkout/route.ts`
- Modify: `src/app/api/pixelqrypt/checkout/route.ts`
- Modify: `src/app/api/creator/premium/checkout/route.ts`
- Modify: `src/lib/checkoutRuntime.ts`
- Test: `src/app/api/checkout/route.test.ts`
- Test: `src/app/api/pixelqrypt/checkout/route.test.ts`
- Test: `src/app/api/creator/premium/checkout/route.test.ts`

- [ ] **Step 1: Write failing route tests for clearer purchase errors**

```ts
it('returns 503 with a buyer-safe error when Stripe is unavailable', async () => {
  delete process.env.STRIPE_SECRET_KEY;
  const res = await POST(req);
  expect(res.status).toBe(503);
  expect(await res.json()).toEqual(expect.objectContaining({ error: 'Stripe checkout is not configured.' }));
});

it('returns 400 for an empty PixelQrypt code payload', async () => {
  const res = await POST(new Request('http://local/api/pixelqrypt/checkout', { method: 'POST', body: '{}' }));
  expect(res.status).toBe(400);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/app/api/checkout/route.test.ts src/app/api/pixelqrypt/checkout/route.test.ts src/app/api/creator/premium/checkout/route.test.ts`

Expected: FAIL where the current route still emits generic internal errors or incomplete request handling.

- [ ] **Step 3: Extend shared checkout runtime classification**

```ts
export class MissingCheckoutInputError extends Error {}

if (!code) {
  throw new MissingCheckoutInputError('Missing code');
}
```

```ts
if (error instanceof MissingCheckoutInputError) {
  return { error: error.message, status: 400 };
}
```

- [ ] **Step 4: Normalize route responses around buyer-safe messages**

```ts
return NextResponse.json(
  { error: 'Unable to start checkout right now. Please try again in a moment.' },
  { status: 503 },
);
```

- [ ] **Step 5: Run tests to verify it passes**

Run: `npm test -- src/app/api/checkout/route.test.ts src/app/api/pixelqrypt/checkout/route.test.ts src/app/api/creator/premium/checkout/route.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/api/checkout/route.ts src/app/api/pixelqrypt/checkout/route.ts src/app/api/creator/premium/checkout/route.ts src/lib/checkoutRuntime.ts src/app/api/checkout/route.test.ts src/app/api/pixelqrypt/checkout/route.test.ts src/app/api/creator/premium/checkout/route.test.ts
git commit -m "fix: harden direct purchase checkout responses"
```

### Task 4: Cover Gallery, Customizer, And PixelQrypt Purchase Paths

**Files:**
- Modify: `src/app/gallery/page.tsx`
- Modify: `src/components/ProductCustomizer.tsx`
- Modify: `src/app/pixelqrypt/page.tsx`
- Test: `src/components/ProductCustomizer.test.tsx`
- Test: `src/app/pixelqrypt/page.test.tsx`
- Test: `tests/e2e/customer.journey.spec.ts`

- [ ] **Step 1: Write the failing flow tests**

```ts
it('adds a customized product to cart with PixelQrypt branding metadata', async () => {
  render(<ProductCustomizer />);
  await user.click(screen.getByRole('button', { name: /add to cart/i }));
  expect(addToCartMock).toHaveBeenCalledWith(expect.objectContaining({
    metadata: expect.objectContaining({ brandSignature: 'PixelQrypt by ForeverTech LLC' }),
  }));
});
```

```ts
test('pixelqrypt purchase route is reachable from the direct code page', async ({ page }) => {
  await page.goto('/pixelqrypt?code=ABC123');
  await expect(page.getByRole('button', { name: /purchase download access|buy this code \/ artwork/i })).toBeVisible();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/components/ProductCustomizer.test.tsx src/app/pixelqrypt/page.test.tsx`

Run: `npx playwright test tests/e2e/customer.journey.spec.ts --grep "pixelqrypt|guest checkout"`

Expected: FAIL because the product metadata and direct-purchase flow are not yet asserted end to end.

- [ ] **Step 3: Stamp shared brand metadata into purchase items**

```ts
metadata: {
  ...existingMetadata,
  brandSignature: 'PixelQrypt by ForeverTech LLC',
  supportEmail: 'support@forevertech.tech',
}
```

- [ ] **Step 4: Tighten buyer messaging on the PixelQrypt purchase page**

```tsx
{buyStatus === 'error' ? (
  <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
    Unable to start PixelQrypt checkout right now. Please try again in a moment.
  </div>
) : null}
```

- [ ] **Step 5: Run tests to verify it passes**

Run: `npm test -- src/components/ProductCustomizer.test.tsx src/app/pixelqrypt/page.test.tsx`

Run: `npx playwright test tests/e2e/customer.journey.spec.ts --grep "guest checkout"`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/gallery/page.tsx src/components/ProductCustomizer.tsx src/app/pixelqrypt/page.tsx src/components/ProductCustomizer.test.tsx src/app/pixelqrypt/page.test.tsx tests/e2e/customer.journey.spec.ts
git commit -m "feat: cover gallery and direct purchase flows"
```

### Task 5: Full Commerce Verification And Cleanup

**Files:**
- Modify: `tests/e2e/customer.journey.spec.ts`
- Modify: `e2e/checkout.spec.ts`
- Modify: `docs/API.md`

- [ ] **Step 1: Write the failing E2E parity test for the hosted-checkout model**

```ts
test('legacy checkout spec follows Stripe-hosted redirect instead of inline card fields', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page.getByTestId('submit-payment')).toBeVisible();
  await expect(page.locator('[data-testid="input-card"]')).toHaveCount(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/checkout.spec.ts`

Expected: FAIL because the existing legacy spec still expects inline card fields.

- [ ] **Step 3: Rewrite the stale spec around the real hosted-checkout journey**

```ts
await page.getByTestId('submit-payment').click();
await page.waitForURL('**/checkout/success?session_id=*');
await expect(page.getByRole('heading', { name: 'Payment Successful!' })).toBeVisible();
```

- [ ] **Step 4: Document the supported commerce flows**

```md
## Commerce flows

- Cart checkout: `/cart` -> `/checkout` -> Stripe Checkout -> `/checkout/success`
- PixelQrypt direct purchase: `/pixelqrypt` -> `/api/pixelqrypt/checkout`
- Premium Creator upgrade: `/checkout` or `/profile` -> `/api/creator/premium/checkout`
```

- [ ] **Step 5: Run the full verification suite**

Run: `npm test -- src/components/Header.test.tsx src/components/Footer.test.tsx src/app/layout.metadata.test.ts src/app/checkout/page.test.tsx src/app/api/checkout/route.test.ts src/app/api/creator/premium/checkout/route.test.ts src/app/api/pixelqrypt/checkout/route.test.ts src/components/ProductCustomizer.test.tsx src/app/pixelqrypt/page.test.tsx`

Run: `npx playwright test tests/e2e/customer.journey.spec.ts e2e/checkout.spec.ts`

Run: `npx eslint src`

Expected: PASS with no failing tests and no new lint errors.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/customer.journey.spec.ts e2e/checkout.spec.ts docs/API.md
git commit -m "test: verify storefront commerce flows"
```
