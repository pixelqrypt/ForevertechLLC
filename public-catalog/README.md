# ForeverTech Public Catalog

## 1. Local Setup

### Commerce Runtime
- Copy `.env.example` to `.env.local`.
- Set `NEXT_PUBLIC_SITE_URL` to the public origin for the running app. Local dev uses `http://localhost:3001`.
- Set `STRIPE_SECRET_KEY` for hosted checkout flows.
- Set `STRIPE_WEBHOOK_SECRET` if you are testing webhook fulfillment locally.
- `STRIPE_QUANTUM_GENERATION_PRICE_CENTS` is optional and defaults to `999` for the Studio real-quantum unlock.
- Verify runtime readiness at `GET /api/health`.

### Quantum Checkout Readiness
- `checks.integrations.stripe.hasSecretKey` must be `true`.
- `checks.integrations.stripe.hasSiteUrl` must be `true`.
- `checks.integrations.stripe.quantumCheckoutReady` must be `true`.
- When those are set, the Studio `$9.99` real quantum action can create a live Stripe Checkout session and return to `/studio?quantum_session_id=...`.

## 2. Architecture Decisions

### Tech Stack
- **Framework**: Next.js 14+ (App Router) for robust SSR/SSG and SEO capabilities.
- **Language**: TypeScript for type safety and developer experience.
- **Styling**: Tailwind CSS for utility-first, responsive design with consistent design tokens.
- **Icons**: Lucide React for lightweight, consistent iconography.
- **State Management**: React Hooks (`useState`, `useEffect`) combined with Server-Sent Events (SSE) for real-time updates.
- **Animation**: Framer Motion for smooth, hardware-accelerated interactions.
- **Containerization**: Docker for consistent deployment across environments.

### Key Architectural Patterns
- **Server-Side Rendering (SSR)**: Initial page load fetches data on the server (`page.tsx`) to ensure SEO friendliness and fast First Contentful Paint (FCP).
- **Client-Side Hydration**: Interactive components (`CatalogGrid`, `CatalogItem`) hydrate on the client to enable dynamic features.
- **Real-Time Updates**: Implemented using Server-Sent Events (SSE) via a dedicated `/api/events` endpoint on the backend. This avoids polling overhead and ensures immediate content availability.
- **Lazy Loading**: Native Next.js `Image` component handles lazy loading and optimization of media assets.

## 3. API Contracts

### `GET /api/catalog/posts`
- **Description**: Fetches the complete history of posts for the initial catalog view.
- **Response**:
  ```json
  {
    "success": true,
    "posts": [
      {
        "content": "string",
        "timestamp": "ISO8601 string",
        "ipfsHash": "string",
        "metadata": {
          "mediaUrl": "string (optional)",
          "title": "string (optional)",
          "price": "number (optional)"
        }
      }
    ]
  }
  ```

### `GET /api/events` (SSE)
- **Description**: Streaming endpoint for real-time updates.
- **Events**:
  - `new_post`: Emitted when a new post is created via the Unified Composer.
    - **Payload**: Same structure as a single post item above.

## 4. Testing Strategy

### Unit Testing
- **Tools**: Vitest + React Testing Library
- **Focus**:
  - Component rendering (CatalogItem, Header).
  - Utility functions (currency conversion, date formatting).
  - Hook logic (SSE connection management).

### E2E Testing
- **Tools**: Playwright (`@playwright/test`)
- **Run**:
  - `npm run test:e2e`
  - Starts the Next.js dev server automatically (and reuses an existing server locally).
- **Cross-platform coverage**:
  - Browsers: Chromium, Firefox, WebKit
  - Devices/layouts: Desktop + Mobile (device presets) to validate responsive design
- **Customer journeys covered (with expected outcomes)**:
  - Navigation + browsing: core routes render and primary navigation works.
  - Product browsing + search: catalog loads, search/filter reduces results without breaking layout.
  - Cart operations: “Buy Now” adds to cart, cart renders items, remove clears the cart UI.
  - Checkout (guest): checkout form validates required fields, shipping quotes render, submit redirects to a success URL.
  - Payment processing simulation: `/api/checkout` is mocked in E2E to redirect to `/checkout/success?session_id=...` (no Stripe dependency).
  - Post-purchase: success page finalization calls are mocked; NFT claim flow is exercised via mocked `/api/nft/claim`.
  - Account creation + login/logout: register/login calls are mocked (API routes are not required), header state updates, profile route enforces auth.
  - Error handling: invalid login shows an error banner; shipping quote failures render a user-visible message.
  - Performance guardrails: key pages load under a conservative budget (to catch regressions, not to enforce Lighthouse-grade numbers).
- **Test data**:
  - Diverse customer profiles live in `tests/e2e/fixtures/customerProfiles.ts` (US/GB/JP examples).

## 5. Performance Benchmarks (Targets)

- **Lighthouse Performance Score**: > 90
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1

### Optimizations
- **Image Optimization**: Using `next/image` for automatic WebP conversion and resizing.
- **Code Splitting**: Automatic per-route code splitting.
- **Font Optimization**: Using `next/font` to self-host and preload fonts.

## 6. Accessibility Audit Results (Target: WCAG 2.1 AA)

- **Color Contrast**: All text elements meet 4.5:1 ratio.
- **Keyboard Navigation**: All interactive elements (buttons, links) are focusable and have visible focus states.
- **Screen Readers**:
  - Images have `alt` text.
  - Semantic HTML (`main`, `header`, `nav`, `article`) used throughout.
  - ARIA labels used for icon-only buttons.

## 7. Analytics Implementation Details

- **Provider**: Google Analytics 4 (GA4) via `@next/third-parties/google`.
- **Events Tracked**:
  - `page_view`: Standard page tracking.
  - `view_item`: When a catalog item is viewed/hovered.
  - `add_to_cart`: Click on "Buy" buttons.
  - `purchase`: Successful transaction (mocked).
  - `filter_usage`: Interaction with search/filter controls.
