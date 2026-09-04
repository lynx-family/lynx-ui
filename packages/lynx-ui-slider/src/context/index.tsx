// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext, useContext } from '@lynx-js/react'

import type { NodesRef } from '@lynx-js/types'

import type { SliderThumbIndex, SliderValue } from '../types'

interface SliderNodeRef {
  current: NodesRef | null
}

export interface SliderContextValue {
  trackRef: SliderNodeRef
  indicatorRef: SliderNodeRef
  thumbRefs: readonly [SliderNodeRef, SliderNodeRef]
  currentValue: { current: SliderValue }
  active: boolean
  activeThumbIndex: SliderThumbIndex | null
  disabled: boolean
  enableRTL: boolean
  onThumbInteractionStart: (index: SliderThumbIndex) => void
  onTrackLayoutChange: (event: {
    params: { width: number, height: number }
    detail?: { width: number, height: number }
  }) => void
}

export const SliderContext = createContext<SliderContextValue | null>(null)

export function useSliderContext(): SliderContextValue {
  const context = useContext(SliderContext)
  if (!context) {
    throw new Error('Slider components must be used inside <SliderRoot>.')
  }
  return context
}
