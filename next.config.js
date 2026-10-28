// Builder dev-tools inject an overlay that intercepts clicks in e2e tests.
// playwright.config.ts sets E2E_TEST=1 for the dev server it starts.
const withBuilderDevTools = require("@builder.io/dev-tools/next")({
  enabled: !process.env.E2E_TEST,
});

// No X-Frame-Options / frame-ancestors on purpose: the Builder visual editor
// embeds the site in an iframe. Add them when Builder is removed.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    // The camera is for this site only: the usher scans tickets with it. With
    // camera=() the browser refuses it without even asking the user.
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = withBuilderDevTools({
  // Next 16 builds with Turbopack. The Builder dev-tools wrapper adds a webpack
  // config that Turbopack ignores (it only matters inside Builder's local visual
  // editor); the empty object acknowledges that. Remove with Builder.
  turbopack: {},
  images: {
    // Footer icons are hosted on Builder's CDN. Remove with Builder.
    remotePatterns: [{ protocol: "https", hostname: "cdn.builder.io" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
});

module.exports = nextConfig;
