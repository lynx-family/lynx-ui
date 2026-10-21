// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMemo, useState } from '@lynx-js/react'

import { Presence, PresenceState } from '@lynx-js/lynx-ui-presence'

import { ToastContext } from './toastContext'
import type { ToastRootProps } from './types'

// // Maintain a globalToastId to generate unique id for each toast.
let globalToastId = 0

export function ToastRoot(props: ToastRootProps) {
  const {
    children,
    show = false,
    onClose,
    onOpen,
    forceMount = false,
    debugLog,
  } = props
  const [toastId, _] = useState<number>(() => globalToastId++)

  const [state, setPresenceState] = useState<PresenceState>(
    PresenceState.Left,
  )

  const ToastContextValue = useMemo(() => ({
    toastId,
    state,
    forceMount,
    setPresenceState,
    debugLog,
  }), [toastId, state, forceMount, setPresenceState, debugLog])

  return (
    <ToastContext.Provider
      value={ToastContextValue}
    >
      <Presence
        show={show}
        onOpen={onOpen}
        onClose={onClose}
        state={state}
        enableDelay={true}
        setPresenceState={setPresenceState}
        debugLog={debugLog}
      >
        {children}
      </Presence>
    </ToastContext.Provider>
  )
}
