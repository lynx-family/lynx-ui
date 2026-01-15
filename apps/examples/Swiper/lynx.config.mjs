// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { exampleConfig } from '../../../tools/configs/exampleConfig.mjs'

const defaultConfig = exampleConfig(
  {
    SwiperBasic: './Basic/index.tsx',
    SwiperBasicDynamic: './BasicDynamic/index.tsx',
    SwiperBasicUpdateSize: './BasicUpdateSize/index.tsx',
    SwiperGap: './WithGap/index.tsx',
    SwiperBounces: './Bounces/index.tsx',
    SwiperLoop: './Loop/index.tsx',
    SwiperCustom: './Custom/index.tsx',
    SwiperCustomScale: './CustomScale/index.tsx',
    SwiperCustomTinder: './CustomTinder/index.tsx',
    Indicator: './Indicator/index.tsx',
    SwiperLazy: './Lazy/index.tsx',
    SwiperRTL: './RTL/index.tsx',
    SwiperRTLLoop: './RTLLoop/index.tsx',
    SwiperRTLLynxRTL: './RTLLoopLynxRTL/index.tsx',
    SwiperRTLCustom: './RTLCustom/index.tsx',
    SwiperDifferentHeight: './DifferentHeight/index.tsx',
  },
  { needWeb: true },
)

export default defaultConfig
