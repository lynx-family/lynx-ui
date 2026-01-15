// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext } from '@lynx-js/react'

import { noop } from '@lynx-js/lynx-ui-common'
import { PresenceState } from '@lynx-js/lynx-ui-presence'

export const DialogContext = createContext<{
  show: boolean
  forceMount: boolean
  groupState: PresenceState
  setGroupState: (state: PresenceState) => void
  setUncontrolledShow: (prop: boolean) => void
  onOpen?: () => void
  onClose?: () => void
  onShowChange?: (show: boolean) => void
}>({
  show: false,
  forceMount: false,
  groupState: PresenceState.Left,
  setGroupState: noop,
  setUncontrolledShow: noop,
})
