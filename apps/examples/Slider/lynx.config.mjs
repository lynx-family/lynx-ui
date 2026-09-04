// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { exampleConfig } from '../../../tools/configs/exampleConfig.mjs'

const defaultConfig = exampleConfig({
  SliderBasic: './Basic/index.tsx',
  SliderControlled: './Controlled/index.tsx',
  SliderPriceRange: './PriceRange/index.tsx',
  SliderShapes: './Shapes/index.tsx',
  SliderFacade: './Facade/index.tsx',
  SliderDynamicWidth: './DynamicWidth/index.tsx',
  SliderProgress: './Progress/index.tsx',
  SliderWithScrollView: './WithScrollView/index.tsx',
}, { enableWebBundle: true })

export default defaultConfig
