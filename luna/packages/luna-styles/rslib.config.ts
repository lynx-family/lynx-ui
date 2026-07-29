// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineConfig } from '@rslib/core'

import {
  lunaDarkTokens,
  lunaLightTokens,
  lunarisDarkTokens,
  lunarisLightTokens,
} from '@lynx-js/luna-tokens'

import { generateLunaCssPlugin } from './scripts/generateCss.js'

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: ['node 18'],
      dts: false,
    },
  ],
  plugins: [
    generateLunaCssPlugin([
      lunaDarkTokens,
      lunaLightTokens,
      lunarisDarkTokens,
      lunarisLightTokens,
    ]),
  ],
})
