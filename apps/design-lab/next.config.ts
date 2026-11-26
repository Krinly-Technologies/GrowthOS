import type { NextConfig } from 'next';

// Development-only design lab (Phase 02A). Intentionally no `output: 'standalone'` and no build
// script in package.json: this app is never built for production, containerised or deployed.
const config: NextConfig = {
  transpilePackages: ['@krinly/ui'],
  poweredByHeader: false,
  // Keeps the Next.js dev badge out of design screenshots.
  devIndicators: false,
};

export default config;
