import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin'
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin'

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
