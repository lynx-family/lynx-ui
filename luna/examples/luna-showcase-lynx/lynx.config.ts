// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin'
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin'
import { defineConfig } from '@lynx-js/rspeedy'
import { pluginTailwindCSS } from 'rsbuild-plugin-tailwindcss'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  source: {
    entry: {
      ActBloom: './src/demos/ActBloom.tsx',
      ActMoonrise: './src/demos/ActMoonrise.tsx',
      ActOne: './src/demos/ActOne.tsx',
      ActTwo: './src/demos/ActTwo.tsx',
      ActButton: './src/demos/ActButton.tsx',
      ActSwitch: './src/demos/ActSwitch.tsx',
      ActCheckbox: './src/demos/ActCheckbox.tsx',
      ActRadioGroup: './src/demos/ActRadioGroup.tsx',
      ActPopover: './src/demos/ActPopover.tsx',
      ActDialog: './src/demos/ActDialog.tsx',
    },
  },
  plugins: [
    pluginQRCode({
      schema(url) {
        // We use `?fullscreen=true` to open the page in LynxExplorer in full screen mode
        return `${url}?fullscreen=true&luna_theme=lunaris-dark`
      },
    }),
    pluginReactLynx({
      enableCSSInheritance: true,
    }),
    pluginTailwindCSS({ config: 'tailwind.config.ts' }),
  ],
  environments: {
    web: {
      source: {
        define: {
          __WEB__: 'true',
        },
      },
      output: {
        assetPrefix: '/',
      },
    },
    lynx: {
      source: {
        define: {
          __WEB__: 'false',
        },
      },
      output: {
        assetPrefix:
          'https://sf16-va.tiktokcdn.com/obj/eden-va2/zalzzh-ukj-lapzild-shpjpmmv-eufs/ljhwZthlaukjlkulzlp/Luna/stage/',
      },
    },
  },
})
