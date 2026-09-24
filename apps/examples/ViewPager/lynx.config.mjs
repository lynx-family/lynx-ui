// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { exampleConfig } from '../../../tools/configs/exampleConfig.mjs'

const defaultConfig = exampleConfig(
  {
    ViewPagerBasic: './Basic/index.tsx',
    ViewPagerGallery: './Gallery/index.tsx',
    ViewPagerAutoHeight: './AutoHeight/index.tsx',
    ViewPagerDynamicHeight: './DynamicHeight/index.tsx',
    ViewPagerNestedList: './NestedList/index.tsx',
    ViewPagerPresentation: './Presentation/index.tsx',
  },
)

export default defaultConfig
