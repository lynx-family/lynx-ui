// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { fileURLToPath } from 'node:url'

import { vitestTestingLibraryPlugin } from '@lynx-js/react/testing-library/plugins'
import { defineConfig } from 'vitest/config'

const config = defineConfig({
  root: import.meta.dirname,
  plugins: [vitestTestingLibraryPlugin()],
  resolve: {
    alias: {
      '@lynx-js/lynx-ui-common': fileURLToPath(
        new URL('../lynx-ui-common/src/index.tsx', import.meta.url),
      ),
      '@lynx-js/lynx-ui-dialog': fileURLToPath(
        new URL('../lynx-ui-dialog/src/index.tsx', import.meta.url),
      ),
      '@lynx-js/lynx-ui-overlay': fileURLToPath(
        new URL('../lynx-ui-overlay/src/index.tsx', import.meta.url),
      ),
      '@lynx-js/lynx-ui-presence': fileURLToPath(
        new URL('../lynx-ui-presence/src/index.tsx', import.meta.url),
      ),
    },
  },
  test: {
    name: 'lynx-ui-sheet',
    include: ['__tests__/*.test.{ts,tsx}'],
    server: {
      deps: {
        inline: ['@lynx-js/motion', '@lynx-js/gesture-runtime'],
      },
    },
  },
})

export default config
