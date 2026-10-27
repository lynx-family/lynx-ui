// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { fileURLToPath } from 'node:url'

import { defineConfig, type UserConfig } from 'vitest/config'

const config: UserConfig = defineConfig({
  resolve: {
    alias: {
      '@lynx-js/lynx-ui-common': fileURLToPath(
        new URL('../lynx-ui-common/src/index.tsx', import.meta.url),
      ),
    },
  },
  test: {
    name: 'lynx-ui-popover',
  },
})

export default config
