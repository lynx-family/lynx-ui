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

const examplePackages = [
  '@lynx-example/lynx-ui-button',
  '@lynx-example/lynx-ui-checkbox',
  '@lynx-example/lynx-ui-common',
  '@lynx-example/lynx-ui-deferred-component',
  '@lynx-example/lynx-ui-dialog',
  '@lynx-example/lynx-ui-draggable',
  '@lynx-example/lynx-ui-feed-list',
  '@lynx-example/lynx-ui-form',
  '@lynx-example/lynx-ui-input',
  '@lynx-example/lynx-ui-input-otp',
  '@lynx-example/lynx-ui-lazy-component',
  '@lynx-example/lynx-ui-list',
  '@lynx-example/lynx-ui-popover',
  '@lynx-example/lynx-ui-radio-group',
  '@lynx-example/lynx-ui-scroll-coordinator',
  '@lynx-example/lynx-ui-scroll-view',
  '@lynx-example/lynx-ui-sheet',
  '@lynx-example/lynx-ui-slider',
  '@lynx-example/lynx-ui-sortable',
  '@lynx-example/lynx-ui-swipe-action',
  '@lynx-example/lynx-ui-swiper',
  '@lynx-example/lynx-ui-switch',
  '@lynx-example/lynx-ui-tab-group',
  '@lynx-example/lynx-ui-view-pager',
] as const

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
      ...examplePackages.map((packageName) => ({
        name: path.join(__dirname, './node_modules', packageName, 'dist'),
        watch: true,
        copyOnBuild: true,
      })),
      {
        name: 'public',
        watch: true,
        copyOnBuild: true,
      },
    ],
  },
})

export default config
