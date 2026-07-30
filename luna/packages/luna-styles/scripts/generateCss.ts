// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { LUNA_COLOR_IDS } from '@lynx-js/luna-core'
import type { LunaThemeTokens } from '@lynx-js/luna-core'
import type { RsbuildPlugin } from '@rslib/core'

export function generateLunaCssPlugin(
  themes: LunaThemeTokens[],
  prefix = '',
): RsbuildPlugin {
  return {
    name: 'generate-luna-css',
    setup(api) {
      api.onAfterBuild(() => {
        const dist = join(process.cwd(), 'dist')
        mkdirSync(dist, { recursive: true })

        for (const theme of themes) {
          const lines = LUNA_COLOR_IDS.map(id => {
            const value = theme.colors[id]
            if (!value) {
              throw new Error(`Missing "${id}" in ${theme.key}`)
            }

            // Compute CSS variable name.
            // If prefix is empty, use "--id"; otherwise "--prefix-id".
            const varName = prefix ? `--${prefix}-${id}` : `--${id}`

            return `  ${varName}: ${value};`
          }).join('\n')

          const css = `.${theme.key} {\n${lines}\n}\n`
          writeFileSync(join(dist, `${theme.key}.css`), css, 'utf8')
          process.stderr.write(`Generated: ${theme.key}.css\n`)
        }

        const indexContent = themes
          .map(t => `@import "./${t.key}.css";`)
          .join('\n')

        writeFileSync(join(dist, 'index.css'), indexContent, 'utf8')
        process.stderr.write(`Generated: index.css\n`)

        try {
          const files = readdirSync(dist)
          const jsFiles = files.filter(f =>
            f.endsWith('.js') || f.endsWith('.mjs')
          )
          for (const file of jsFiles) {
            const filePath = join(dist, file)
            rmSync(filePath)
            process.stderr.write(`Deleted: ${file}\n`)
          }
        } catch (error) {
          console.warn('Error when cleaning up entry file:', error)
        }
        process.stderr.write(`L.U.N.A CSS Files Generated\n`)
      })
    },
  }
}
