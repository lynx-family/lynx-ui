// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const config = defineConfig({
  resolve: {
    alias: {
      '@lynx-js/lynx-ui-presence': fileURLToPath(
        new URL('../lynx-ui-presence/src/index.tsx', import.meta.url),
      ),
    },
  },
  define: {
    __MAIN_THREAD__: 'true',
  },
  test: {
    name: 'lynx-ui-sheet',
    server: {
      deps: {
        inline: ['@lynx-js/motion'],
      },
    },
  },
})

export default config
