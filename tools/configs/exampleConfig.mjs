import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin'
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const packagesDir = path.resolve(__dirname, '../../packages')

export const exampleConfig = (entry, needWeb = true) => {
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
      include: [
        /@lynx-js\/gesture-runtime/,
        /@lynx-js\/react-use/,
        /@lynx-js\/motion-lynx/,
        /@lynx-js\/motion-lynx-canary*./,
        /@lynx-js\/motion-lynx-canary\/mini/,
        {
          and: [packagesDir, { not: /[\\/]node_modules[\\/]/ }],
        },
      ],
    },
    output: {
      distPath: {
        intermediate: '.rspeedy',
        root: 'dist',
      },
      filename: '[name]/[platform].template.js',
    },
    tools: {
      rspack: {
        resolve: {
          mainFields: ['jsnext:source', 'lynx', 'module', 'browser'],
        },
      },
    },

    plugins: [
      pluginQRCode({
        schema(url) {
          return `${url}?fullscreen=true&luna_theme=lunaris-dark&bar_color=0d0d0d&bg_color=0d0d0d`
        },
      }),
      pluginReactLynx({
        enableCSSSelector: true,
        targetSdkVersion: '2.14',
        enableCSSInheritance: true,
        enableNewGesture: true,
      }),
    ],
  }
}
