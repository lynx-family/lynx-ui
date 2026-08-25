// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginTailwindCSS } from 'rsbuild-plugin-tailwindcss'

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginTailwindCSS({ config: 'tailwind.config.ts' }),
  ],
  html: {
    title: 'L.U.N.A Design System',
  },
  server: {
    historyApiFallback: true,
  },
  dev: {
    client: {
      overlay: false,
    },
    writeToDisk: false,
  },
})
