// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { exampleConfig } from '../../../tools/configs/exampleConfig.mjs'

const defaultConfig = exampleConfig(
  {
    TabGroupBasic: './Basic/index.tsx',
    TabGroupSizing: './Sizing/index.tsx',
    TabGroupIndicatorMotion: './IndicatorMotion/index.tsx',
    TabGroupInitialSelection: './InitialSelection/index.tsx',
    TabGroupImperativeSelection: './ImperativeSelection/index.tsx',
    TabGroupPanel: './Panel/index.tsx',
  },
)

export default defaultConfig
