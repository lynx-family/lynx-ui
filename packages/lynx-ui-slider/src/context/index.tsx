// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext, useContext } from '@lynx-js/react'

import type { NodesRef } from '@lynx-js/types'

export interface SliderContextValue {
  valueRef: { current: NodesRef | null }
  currentValue: { current: number }
  enableRTL: boolean
}

export const SliderContext = createContext<SliderContextValue | null>(null)

export function useSliderContext(): SliderContextValue {
  const context = useContext(SliderContext)
  if (!context) {
    throw new Error('Slider components must be used inside <SliderRoot>.')
  }
  return context
}
