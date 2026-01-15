// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { pluginReact } from '@rsbuild/plugin-react'
import type { RslibConfig } from '@rslib/core'

export const baseConfig: RslibConfig = {
  plugins: [
    pluginReact({
      swcReactOptions: {
        runtime: 'preserve',
      },
    }),
  ],
  lib: [
    {
      bundle: false,
      format: 'esm',
      syntax: 'es6',
      output: {
        distPath: {
          root: './dist',
        },
        filename: {
          js: '[name].jsx',
        },
        sourceMap: true,
        emitCss: true,
        overrideBrowserslist: 'esnext',
      },
      dts: true,
    },
  ],
}
