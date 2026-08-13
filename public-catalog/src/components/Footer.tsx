import Link from "next/link";
import { OWNER_BRAND, OWNER_STATEMENT, PRIMARY_BRAND, SUPPORT_EMAIL } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-black text-white">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-sm font-semibold">{PRIMARY_BRAND}</div>
            <div className="text-xs uppercase tracking-[0.22em] text-white/45">by {OWNER_BRAND}</div>
            <div className="text-sm text-white/70">84 Luisa St, Brooklyn, NY 10223</div>
            <div className="text-sm text-white/70">Hours: 24/7</div>
            <a className="text-sm text-blue-300 hover:text-blue-200" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Help</div>
            <div className="grid gap-1 text-sm">
              <Link className="text-white/70 hover:text-white" href="/support">
                Support
              </Link>
              <Link className="text-white/70 hover:text-white" href="/shipping-policy">
                Shipping Policy
              </Link>
              <Link className="text-white/70 hover:text-white" href="/refund-policy">
                Refund & Return Policy
              </Link>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Legal</div>
            <div className="grid gap-1 text-sm">
              <Link className="text-white/70 hover:text-white" href="/terms">
                Terms of Service
              </Link>
              <Link className="text-white/70 hover:text-white" href="/privacy-policy">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} {OWNER_BRAND}. All rights reserved.</div>
          <div>{OWNER_STATEMENT}</div>
          <div>Payments are processed securely by Stripe.</div>
        </div>
      </div>
    </footer>
  );
}
