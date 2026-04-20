// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext } from '@lynx-js/react'

import { noop } from '@lynx-js/lynx-ui-common'

import type { SwiperContextProps } from '../types'

export const SwiperContext = createContext<SwiperContextProps>({
  itemWidth: 350,
  itemHeight: 'auto',
  setChildrenRef: noop,
  modeConfig: {
    mode: 'normal',
    align: 'start',
  },
  initialIndex: 0,
  loop: false,
  spaceBetween: 0,
  RTL: false,
})
