// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { exampleConfig } from '../../../tools/configs/exampleConfig.mjs'

export default exampleConfig({
  ScrollCoordinatorList: './List/index.tsx',
  ScrollCoordinatorViewPager: './ViewPager/index.tsx',
  ScrollCoordinatorViewPagerList: './ViewPagerList/index.tsx',
  ScrollCoordinatorRefreshCoordinator: './RefreshCoordinator/index.tsx',
  ScrollCoordinatorRefreshPage: './RefreshPage/index.tsx',
})
