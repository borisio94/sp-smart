import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// En-têtes de sécurité appliqués à tout le site.
// CSP volontairement permissive (Studio Sanity, hCaptcha, Google Maps,
// YouTube) — peut être resserrée ultérieurement si besoin.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    // Images servies depuis le CDN de Sanity
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
