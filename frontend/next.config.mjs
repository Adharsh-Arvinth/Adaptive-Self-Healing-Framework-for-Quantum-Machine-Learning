/** @type {import('next').NextConfig} */

// Origins the browser may talk to. The lab calls the simulator backend over HTTPS and a WebSocket.
const API = process.env.NEXT_PUBLIC_API_URL || "https://qml-backend-nczx.onrender.com";
const WS = process.env.NEXT_PUBLIC_WS_URL || API.replace(/^http/, "ws") + "/ws/telemetry";
const apiOrigin = new URL(API).origin;
const wsOrigin = new URL(WS).origin;

// Content-Security-Policy: only this site's own scripts, styles and fonts; network access only to
// the simulator backend; the site may not be embedded in other pages (clickjacking protection).
// 'unsafe-inline' is required for Next.js' inline bootstrap script and for inline animation styles.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  `connect-src 'self' ${apiOrigin} ${wsOrigin}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  // Output standalone build for containerized & cloud deployments
  output: "standalone",
  // Do not advertise the framework, and never ship readable source maps to browsers.
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    // Dev mode needs eval for hot reloading, so the strict policy applies to production builds only.
    if (process.env.NODE_ENV !== "production") return [];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
