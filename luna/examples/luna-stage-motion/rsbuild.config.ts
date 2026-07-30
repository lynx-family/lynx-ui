// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from '@rsbuild/core'
import type { RsbuildConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const config: RsbuildConfig = defineConfig({
  plugins: [pluginReact()],
  dev: {
    client: {
      overlay: false,
    },
    writeToDisk: false,
  },
  server: {
    publicDir: [
      {
        name: path.join(
          __dirname,
          './node_modules',
          '@lynx-example/lynx-ui-popover',
          'dist',
        ),
        watch: true,
        copyOnBuild: true,
      },
      {
        name: path.join(
          __dirname,
          './node_modules',
          '@lynx-example/design-guide',
          'dist',
        ),
        watch: true,
        copyOnBuild: true,
      },
      {
        name: 'public',
        watch: true,
        copyOnBuild: true,
      },
    ],
  },
})

export default config
