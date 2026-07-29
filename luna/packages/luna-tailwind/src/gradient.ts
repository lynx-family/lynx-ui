// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import plugin from 'tailwindcss/plugin.js'

import type { LunaTailwindPlugin } from './types.js'

const lunaGradientPlugin: LunaTailwindPlugin = plugin(function(api) {
  const addComponents = (...args: Parameters<typeof api.addComponents>) =>
    api.addComponents(...args)

  const theme = (...args: Parameters<typeof api.theme>) => api.theme(...args)

  addComponents({
    '.luna-gradient': {
      background: `linear-gradient(
        160deg,
        ${theme('colors.gradient.a') as string},
        ${theme('colors.gradient.b') as string},
        ${theme('colors.gradient.c') as string},
        ${theme('colors.gradient.d') as string}
      )`,
    },
  })
  addComponents({
    '.luna-gradient-rose': {
      background: `linear-gradient(
        0deg,
        ${theme('colors.gradient.a') as string},
        ${theme('colors.gradient.b') as string}
      )`,
    },
  })
  addComponents({
    '.luna-gradient-berry': {
      background: `linear-gradient(
        0deg,
        ${theme('colors.gradient.b') as string},
        ${theme('colors.gradient.c') as string}
      )`,
    },
  })
  addComponents({
    '.luna-gradient-afterglow': {
      background: `linear-gradient(
        150deg,
        ${theme('colors.gradient.b') as string} 8.42%,
        ${theme('colors.gradient.c') as string} 81.71%
      )`,
    },
  })
  addComponents({
    '.luna-gradient-ocean': {
      background: `linear-gradient(
        0deg,
        ${theme('colors.gradient.c') as string} 60%,
        ${theme('colors.gradient.d') as string} 120%
      )`,
    },
  })
})

export { lunaGradientPlugin }
