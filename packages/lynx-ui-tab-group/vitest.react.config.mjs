// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { fileURLToPath } from 'node:url'

import { vitestTestingLibraryPlugin } from '@lynx-js/react/testing-library/plugins'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [vitestTestingLibraryPlugin()],
  test: {
    include: ['__tests__/**/*.test.{ts,tsx}'],
    name: 'lynx-ui-tab-group-react',
    server: {
      deps: {
        inline: [/@lynx-js\/motion/],
      },
    },
  },
})
