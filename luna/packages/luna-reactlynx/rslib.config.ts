// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { pluginReact } from '@rsbuild/plugin-react'
import { defineConfig } from '@rslib/core'

export default defineConfig({
  plugins: [
    pluginReact({ swcReactOptions: { runtime: 'preserve' } }),
  ],
  source: {
    entry: {
      index: ['src/**', '!src/**/*.test.*', '!src/**/__tests__/**'],
    },
    tsconfigPath: './tsconfig.build.json',
  },
  lib: [{
    bundle: false,
    format: 'esm',
    syntax: 'esnext',
    output: {
      sourceMap: true,
    },
    dts: true,
  }],
})
