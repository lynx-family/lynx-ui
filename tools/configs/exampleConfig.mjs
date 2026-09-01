import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin'
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin'

import { pluginLynxBundleAnalysisStats } from './bundleAnalysisStatsPlugin.mjs'

export const exampleConfig = (entry, options = {}) => {
  const needWeb = typeof options === 'boolean'
    ? options
    : (options.needWeb ?? true)
  return {
    environments: needWeb
      ? {
        web: {},
        lynx: {},
      }
      : {
        lynx: {},
      },
    source: {
      entry: entry,
    },
    output: {
      distPath: {
        intermediate: '.rspeedy',
        root: 'dist',
      },
      filename: '[name].[platform].bundle',
    },
    tools: {
      rspack: {
        resolve: {
          mainFields: ['jsnext:source', 'lynx', 'module', 'browser'],
        },
      },
    },

    plugins: [
      pluginLynxBundleAnalysisStats(),
      pluginQRCode({
        schema(url) {
          return `${url}?fullscreen=true&luna_theme=lunaris-dark&bar_color=0d0d0d&bg_color=0d0d0d`
        },
      }),
      pluginReactLynx({
        enableCSSSelector: true,
        enableCSSInheritance: true,
        enableNewGesture: true,
      }),
    ],
  }
}
