// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@lynx-js/lynx-ui-common': fileURLToPath(
        new URL('../lynx-ui-common/src/index.tsx', import.meta.url),
      ),
    },
  },
  test: {
    name: 'lynx-ui-sortable',
    include: ['__tests__/**/*.test.ts'],
  },
})
