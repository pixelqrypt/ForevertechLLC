import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./health/route";

describe("health route", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_QUANTUM_GENERATION_PRICE_CENTS;
  });

  it("returns ok", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok ?? json.success ?? true).toBeTruthy();
  });

  it("reports checkout readiness for the quantum purchase flow", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://pixelqrypt.com";
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_QUANTUM_GENERATION_PRICE_CENTS = "999";

    const res = await GET();
    const json = await res.json();

    expect(json.checks.integrations.stripe.hasSiteUrl).toBe(true);
    expect(json.checks.integrations.stripe.quantumGenerationPriceCents).toBe(999);
    expect(json.checks.integrations.stripe.quantumCheckoutReady).toBe(true);
  });
});
