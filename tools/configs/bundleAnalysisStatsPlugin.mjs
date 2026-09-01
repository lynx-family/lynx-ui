// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const BUNDLE_STATS_JSON_OPTIONS = {
  assets: true,
  chunks: true,
  modules: true,
  entrypoints: true,
  chunkGroups: true,
}

export function pluginLynxBundleAnalysisStats() {
  return {
    name: 'lynx-ui:bundle-analysis-stats',
    setup(api) {
      if (!process.env['RSPEEDY_BUNDLE_ANALYSIS']) return

      api.onAfterBuild(({ stats }) => {
        if (!stats) return

        const statsPath = path.join(api.context.distPath, 'stats.json')
        mkdirSync(path.dirname(statsPath), { recursive: true })
        writeFileSync(
          statsPath,
          JSON.stringify(
            selectLynxStats(
              stats.toJson(BUNDLE_STATS_JSON_OPTIONS),
            ),
            null,
            2,
          ),
        )
      })
    },
  }
}

export function selectLynxStats(stats) {
  if (!stats.children?.length) return withoutEmptyChildren(stats)

  const lynxStats = stats.children.find(({ name }) =>
    name === 'lynx' || name?.startsWith('lynx-')
  )
  return withoutEmptyChildren(lynxStats ?? stats.children[0])
}

function withoutEmptyChildren(stats) {
  if (!stats.children || stats.children.length > 0) return stats

  const result = { ...stats }
  delete result.children
  return result
}
