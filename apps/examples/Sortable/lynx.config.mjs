// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { exampleConfig } from '../../../tools/configs/exampleConfig.mjs'

const defaultConfig = exampleConfig({
  SortableBasic: './Basic/index.tsx',
  SortableWithScrollView: './WithScrollView/index.tsx',
  SortableScrollableBoundary: './ScrollableBoundary/index.tsx',
  SortableShortScrollView: './ShortScrollView/index.tsx',
  SortableNoBoundary: './NoBoundary/index.tsx',
  SortableDisableSorting: './DisableSorting/index.tsx',
  SortableDisableItems: './DisableItems/index.tsx',
}, { needWeb: false })

export default defaultConfig
