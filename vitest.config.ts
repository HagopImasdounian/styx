/// <reference types="vitest" />
import {fileURLToPath} from 'node:url';

import {defineConfig} from 'vitest/config';

/**
 * Standalone Vitest config — intentionally does NOT reuse vite.config.ts,
 * which loads the Hydrogen/Oxygen/React Router plugins (unneeded and
 * unwanted for unit tests).
 */
export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['app/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
  },
});
