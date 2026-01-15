// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext, useReducer } from '@lynx-js/react'

import { noop } from '@lynx-js/lynx-ui-common'
import { PresenceState } from '@lynx-js/lynx-ui-presence'

import type { ElementInfo } from './floating'
import type { PopoverContextType, UpdateRectsAction } from './types'

const initialPosition = -0

// Reducer function to handle update actions
const ElementInfoReducer = (
  state: ElementInfo,
  action: UpdateRectsAction,
): ElementInfo => {
  switch (action.type) {
    case 'updateReference':
      return { ...state, reference: action.rect }
    case 'updateAlternativeReference':
      return { ...state, alternativeReference: action.rect }
    case 'updateFloating':
      return { ...state, floating: action.rect }
    case 'updateArrowCoords':
      return { ...state, arrow: { ...state.arrow, coords: action.coords } }
    case 'updateArrowInfo':
      return { ...state, arrow: { ...state.arrow, ...action.info } }
    case 'updateFloatingCoords':
      return { ...state, floatingCoords: action.coords }
    case 'updateMaxContentSize':
      return {
        ...state,
        maxContentSize: {
          maxWidth: `${Math.max(0, action.dimension.width)}px`,
          maxHeight: `${Math.max(0, action.dimension.height)}px`,
        },
      }
    default:
      return state
  }
}

export const useElementInfoReducer = () => {
  const initialRects: ElementInfo = {
    reference: {
      width: 0,
      height: 0,
      x: initialPosition,
      y: initialPosition,
    },
    floating: {
      width: 0,
      height: 0,
      x: initialPosition,
      y: initialPosition,
    },
    arrow: {
      coords: { x: initialPosition, y: initialPosition },
      size: 0,
      offset: 0,
    },
    floatingCoords: { x: initialPosition, y: initialPosition },
  }
  const [sharedInfo, updateRects] = useReducer(ElementInfoReducer, initialRects)
  return { sharedInfo, updateRects }
}

export const PopoverContext = createContext<PopoverContextType>({
  sharedInfo: {
    reference: { y: 0, x: 0, width: 0, height: 0 },
    floating: { y: 0, x: 0, width: 0, height: 0 },
    arrow: { coords: { y: 0, x: 0 }, offset: 0, size: 0 },
    floatingCoords: { y: 0, x: 0 },
  },
  updateRects: noop,
  show: false,
  forceMount: false,
  setUncontrolledShow: noop,
  state: PresenceState.Initial,
  setPresenceState: noop,
})
