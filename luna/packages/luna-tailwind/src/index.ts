// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { LUNA_COLOR_IDS } from '@lynx-js/luna-core'
import type { Config } from 'tailwindcss'

import { buildLunaTailwindColors } from './color.js'
import { lunaGradientPlugin } from './gradient.js'
import type { LunaTailwindPlugin } from './types.js'

// Options for the Luna Tailwind plugin
interface LunaTailwindOptions {
  /**
   * Optional CSS variable prefix used in the theme.
   *
   * - undefined / empty: uses `var(--primary)` style
   * - "luna"           : uses `var(--luna-primary)` style
   *
   * This should stay in sync with your CSS generator:
   *  `--${prefix}-${id}` / `--${id}`.
   */
  cssVarPrefix?: string

  /**
   * Mark this preset as a Tailwind "leaf preset".
   *
   * - `true`  (default): emit `presets: []` to avoid inheriting Tailwind's default preset chain
   * - `false`          : do not emit `presets`, allowing default preset inheritance
   *
   * @defaultValue `true`
   */
  leafPreset?: boolean
}

// Internal helper to build the theme extension
function createLunaPreset(
  options?: LunaTailwindOptions,
) {
  const { cssVarPrefix, leafPreset = true } = options ?? {}

  const colorExtensions = buildLunaTailwindColors(
    LUNA_COLOR_IDS,
    cssVarPrefix,
  )

  return {
    plugins: [lunaGradientPlugin],
    ...(leafPreset ? { presets: [] as const } : null),
    theme: {
      extend: {
        fontSize: {
          xs: ['10px', { lineHeight: '13px' }],
          caption: ['11px', { lineHeight: '14px' }],
          sm: ['12px', { lineHeight: '15px' }],
          p2: ['13px', { lineHeight: '17px' }],
          base: ['14px', { lineHeight: '18px' }],
          lg: ['16px', { lineHeight: '21px' }],
          xl: ['17px', { lineHeight: '22px' }],
          '2xl': ['20px', { lineHeight: '25px' }],
        },
        colors: colorExtensions,
      },
    },
  } satisfies Partial<Config>
}

const LunaPreset = createLunaPreset()

export { createLunaPreset, LunaPreset }
export type { LunaTailwindOptions, LunaTailwindPlugin }

export default LunaPreset
