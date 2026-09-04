// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useEffect, useMemo, useState } from '@lynx-js/react'

import { useMemoizedFn } from '@lynx-js/lynx-ui-common'
import { Presence, PresenceState } from '@lynx-js/lynx-ui-presence'

import { ToastContext } from './toastContext'
import type { ToastRootProps } from './types'

export type Prettify<T> =
  & {
    [K in keyof T]: T[K]
  }
  & {}

// Maintain a globalToastId to generate unique id for each toast.
let globalToastId = 0

export interface StaticToastConfig {
  root: Prettify<ToastRootProps>
  duration?: number
}

let openLynxUIToast:
  | null
  | ((config?: StaticToastConfig) => void) = null
let closeLynxUIToast: null | (() => void) = null
// Store the timeout ID to clear the previous timeout if a new open is called
let timeoutId: ReturnType<typeof setTimeout> | null = null

export const toast = {
  open: (config?: StaticToastConfig) => {
    if (openLynxUIToast) {
      // Clear the previous timeout if it exists
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      const { duration } = config ?? {}

      openLynxUIToast(
        config,
      )

      if (duration && duration > 0) {
        timeoutId = setTimeout(() => {
          closeLynxUIToast?.()
          timeoutId = null
        }, duration)
      }
    }
  },
}
export function ToastMountPoint() {
  const [imperativeProps, setImperativeProps] = useState<
    Omit<ToastRootProps, 'show'>
  >({})
  const { children, onClose, onOpen, forceMount = false } = imperativeProps
  const [toastId, _] = useState<number>(() => globalToastId++)
  const [imperativeShow, setImperativeShow] = useState(false)
  const [state, setPresenceState] = useState<PresenceState>(
    PresenceState.Left,
  )

  // Static methods
  const openToast = useMemoizedFn((config?: StaticToastConfig) => {
    if (config) {
      setImperativeProps(config.root)
    }
    setImperativeShow(true)
  })

  const closeToast = useMemoizedFn(() => {
    setImperativeShow(false)
  })

  useEffect(() => {
    openLynxUIToast = openToast
    closeLynxUIToast = closeToast
    return () => {
      openLynxUIToast = null
      closeLynxUIToast = null
    }
  }, [openToast, closeToast])

  const ToastContextValue = useMemo(() => ({
    toastId,
    state,
    forceMount,
    setPresenceState,
  }), [toastId, state, forceMount, setPresenceState])

  return (
    <ToastContext.Provider
      value={ToastContextValue}
    >
      <Presence
        show={imperativeShow}
        onOpen={onOpen}
        onClose={onClose}
        state={state}
        enableDelay={true}
        setPresenceState={setPresenceState}
      >
        {children}
      </Presence>
    </ToastContext.Provider>
  )
}
