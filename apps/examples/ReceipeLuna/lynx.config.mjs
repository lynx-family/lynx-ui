// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { exampleConfig } from '../../../tools/configs/exampleConfig.mjs'

const config = exampleConfig({
  ReceipeLunaBasic: './Basic/index.tsx',
})

// Exercise the published layout entry and its stylesheet in this consumer.
config.tools.rspack.resolve.mainFields = ['module', 'main']

export default config
