// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext, useState } from '@lynx-js/react'

import type {
  PresenceAnimationStatus,
  PresenceContextType,
  PresenceProps,
} from './types'
import { usePresence } from './usePresence'
import { PresenceState, resolveAnimationStatus } from './utils'

export const PresenceContext = createContext<PresenceContextType>(null!)

export const renderPresenceChildren = (
  props: {
    children: PresenceProps['children']
    status: PresenceAnimationStatus
  },
) => {
  const { children, status } = props
  return typeof children === 'function'
    ? children(status)
    : children
}

export function Presence(props: PresenceProps) {
  const {
    show,
    forceMount,
    state,
    setPresenceState,
    children,
    enableDelay = false,
    onOpen,
    onClose,
  } = props
  const [internalState, setInternalState] = useState<PresenceState>(
    PresenceState.Left,
  )
  const presence = usePresence({
    show,
    state: state ?? internalState,
    setPresenceState: setPresenceState ?? setInternalState,
    enableDelay,
    onOpen,
    onClose,
  })
  const { mount } = presence.controllers
  const status = resolveAnimationStatus({
    state: state ?? internalState,
    enableDelay,
  })

  return (
    <PresenceContext.Provider value={presence}>
      {(mount || forceMount) && renderPresenceChildren({ children, status })}
    </PresenceContext.Provider>
  )
}
