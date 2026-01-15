// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineConfig, type UserConfig } from 'vitest/config'

const config: UserConfig = defineConfig({
  define: {
    __DEV__: false,
  },
  test: {
    name: 'lynx-ui-common',
  },
})

export default config
