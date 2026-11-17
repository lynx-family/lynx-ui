// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext } from '@lynx-js/react'

import { noop } from '@lynx-js/lynx-ui-common'
import { PresenceState } from '@lynx-js/lynx-ui-presence'

export interface ToastContextType {
  toastId: number
  state: PresenceState
  forceMount: boolean
  setPresenceState: (state: PresenceState) => void
}

export const ToastContext = createContext<ToastContextType>({
  toastId: 0,
  state: PresenceState.Entered,
  forceMount: false,
  setPresenceState: noop,
})
