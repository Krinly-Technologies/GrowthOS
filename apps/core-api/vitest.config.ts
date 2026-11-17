import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC emits the decorator metadata Nest's dependency injection relies on.
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: ['src/**/*.test.ts'] },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['test/**/*.integration.test.ts'],
          globalSetup: ['test/support/global-setup.ts'],
          testTimeout: 30_000,
          hookTimeout: 60_000,
          // Test files share one local database; run them one at a time.
          fileParallelism: false,
        },
      },
    ],
  },
});
