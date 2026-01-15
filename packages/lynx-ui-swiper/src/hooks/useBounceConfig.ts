// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { BounceConfig } from '../types'

function useBounceConfig(bounceConfig?: BounceConfig) {
  const {
    startBounceItem,
    endBounceItem,
    enable = false,
    startBounceItemWidth = 50,
    endBounceItemWidth = 50,
    onStartBounceItemBounce,
    onEndBounceItemBounce,
  } = bounceConfig ?? {}

  return {
    enableBounce: enable,
    startBounceItem,
    endBounceItem,
    startBounceItemWidth,
    endBounceItemWidth,
    onStartBounceItemBounce,
    onEndBounceItemBounce,
  }
}

export { useBounceConfig }
