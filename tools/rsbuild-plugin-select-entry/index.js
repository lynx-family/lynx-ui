// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
/**
 * @returns {import('@lynx-js/rspeedy').RsbuildPlugin} Returning RSBuildPlugin
 */
export function pluginSelectEntry() {
  return {
    name: 'select-entry',
    setup(api) {
      api.modifyRsbuildConfig({
        order: 'pre',
        async handler(config) {
          if (process.env['CI'] || process.env['NODE_ENV'] !== 'development') {
            return config
          }

          const {
            default: { prompts },
          } = await import('prompts')

          if (!config.source?.entry) {
            return config
          }

          const entries = Object.entries(config.source.entry)

          config.source.entry = Object.fromEntries(
            await prompts.autocompleteMultiselect({
              name: 'value',
              message: 'Pick entries to build',
              choices: entries.map(([key, value]) => ({
                title: key,
                value: [key, value],
              })),
              hint: '- Space to select. Return to submit',
            }),
          )

          return config
        },
      })
    },
  }
}
