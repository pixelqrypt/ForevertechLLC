import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/Providers";
import { Footer } from "@/components/Footer";
import { BRAND_SIGNATURE, OWNER_BRAND, PRIMARY_BRAND } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.pixelqrypt.com"),
  applicationName: PRIMARY_BRAND,
  title: {
    default: PRIMARY_BRAND,
    template: `%s | ${PRIMARY_BRAND}`,
  },
  description:
    `${BRAND_SIGNATURE} creates one-of-one fractal apparel from your prompt, with premium presentation, secure checkout, and a wearable art experience owned and operated by ${OWNER_BRAND}.`,
  keywords: [
    PRIMARY_BRAND,
    OWNER_BRAND,
    "math art",
    "AI art t-shirts",
    "AI art merch",
    "emotional AI art",
    "prompt art",
    "prompt to print",
    "custom t-shirt design",
    "print on demand apparel",
    "fractal art",
    "generative art",
    "Julia set art",
    "Mandelbrot art",
    "graphic tee",
    "streetwear design",
    "aiart",
    "mathart",
    "fractalart",
    "custommerch",
    "quantum story tees",
    "verified origin record",
    "fractal story tee",
    "prompt to merch",
  ],
  openGraph: {
    type: "website",
    url: "https://www.pixelqrypt.com",
    siteName: PRIMARY_BRAND,
    title: BRAND_SIGNATURE,
    description: `${BRAND_SIGNATURE} creates premium fractal apparel with secure checkout, collectible presentation, and a cleaner path from prompt to product.`,
    images: [{ url: "/images/ai-gen-1.png", width: 1200, height: 630, alt: "PixelQrypt AI art apparel preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_SIGNATURE,
    description: `${BRAND_SIGNATURE} creates premium fractal apparel with secure checkout and a cleaner path from prompt to product.`,
    images: ["/images/ai-gen-1.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PRIMARY_BRAND,
  },
  icons: {
    icon: [
      { url: "/icons/pixelqrypt-logo.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased bg-black text-white"
      >
        <Providers>
          <div className="min-h-screen flex flex-col">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
