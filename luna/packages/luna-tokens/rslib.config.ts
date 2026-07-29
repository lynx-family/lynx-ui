// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineConfig } from '@rslib/core'

export default defineConfig({
  source: {
    entry: {
      index: './src/index.ts',
      'luna-light': './src/luna-light.ts',
      'luna-dark': './src/luna-dark.ts',
      'lunaris-light': './src/lunaris-light.ts',
      'lunaris-dark': './src/lunaris-dark.ts',
    },
    tsconfigPath: './tsconfig.build.json',
  },
  lib: [
    {
      dts: true,
      format: 'esm',
    },
    {
      format: 'cjs',
    },
  ],
})
