// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMainThreadRef,
  useMemo,
  useRef,
  useState,
} from '@lynx-js/react'

import { useMemoizedFn } from '@lynx-js/lynx-ui-common'
import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { useMotionValueRef } from '@lynx-js/motion/mini'

import { SheetContext } from '../context'
import type { SheetMethods } from '../context'
import type { SheetRootProps, SheetRootRef } from '../types'

export const SheetRoot = forwardRef<SheetRootRef, SheetRootProps>(
  (props, ref) => {
    const {
      show,
      defaultShow = false,
      forceMount = false,
      children,
      onOpen,
      onClose,
      onShowChange,
      // Physics
      snapPoints,
      initialSnap,
      onSnapChange: onSnapChangeProp,
      screenHeight,
      // Gesture
      rubberBand,
      dragDisabled,
      dismissThreshold,
      handleOnly,
      enableDragToClose,
      claimedGestureAngles,
    } = props
    const sheetProgress = useMotionValueRef<number>(0)
    const presenceStateMTRef = useMainThreadRef<PresenceState>(
      PresenceState.Left,
    )

    const isControlled = show !== undefined
    const [uncontrolledShow, setUncontrolledShow] = useState<boolean>(
      defaultShow,
    )
    const actualShow = isControlled ? show : uncontrolledShow

    const [mounted, setMounted] = useState<boolean>(
      actualShow ? true : false,
    )

    // Wake up the component if show becomes true
    useEffect(() => {
      if (actualShow && !mounted) {
        setMounted(true)
      }
    }, [actualShow, mounted])

    // Store registered methods from SheetContent
    const sheetMethodsRef = useRef<SheetMethods | null>(null)
    const pendingActionsRef = useRef<Array<() => void>>([])

    const handleShowChange = useMemoizedFn((newShow: boolean) => {
      if (newShow === actualShow) return
      onShowChange?.(newShow)
      if (!isControlled) {
        setUncontrolledShow(newShow)
      }
    })

    const registerMethods = useCallback((methods: SheetMethods | null) => {
      sheetMethodsRef.current = methods
      if (methods && pendingActionsRef.current.length > 0) {
        for (const action of pendingActionsRef.current) {
          action()
        }
        pendingActionsRef.current = []
      }
    }, [])

    // Imperative handle methods
    useImperativeHandle(ref, () => {
      const queueAction = (action: () => void) => {
        if (mounted && sheetMethodsRef.current) {
          action()
        } else {
          if (!mounted) setMounted(true)
          pendingActionsRef.current.push(action)
        }
      }

      return {
        snapTo: (index, opts) => {
          handleShowChange(true)
          queueAction(() => sheetMethodsRef.current?.snapTo(index, opts))
        },
        expand: (opts) => {
          handleShowChange(true)
          queueAction(() => sheetMethodsRef.current?.expand(opts))
        },
        collapse: (opts) => {
          handleShowChange(true)
          queueAction(() => sheetMethodsRef.current?.collapse(opts))
        },
        close: (opts) => {
          handleShowChange(false)
          if (mounted || actualShow) {
            queueAction(() => sheetMethodsRef.current?.close(opts))
          }
        },
        open: (opts) => {
          handleShowChange(true)
          queueAction(() => sheetMethodsRef.current?.show?.(opts))
        },
      }
    }, [handleShowChange, mounted])

    const contextValue = useMemo(() => ({
      show: actualShow,
      forceMount,
      setUncontrolledShow,
      groupState: PresenceState.Entered, // Obsolete, keeping for type/compat if needed or remove
      mounted,
      onUnmount: () => {
        setMounted(false)
      },
      onOpen,
      onClose,
      onShowChange: handleShowChange,
      sheetProgress,
      registerMethods,
      // Physics
      snapPoints,
      initialSnap,
      onSnapChange: onSnapChangeProp,
      screenHeight,
      // Gesture
      rubberBand,
      dragDisabled,
      dismissThreshold,
      handleOnly,
      enableDragToClose,
      presenceStateMTRef,
      claimedGestureAngles,
    }), [
      actualShow,
      forceMount,
      setUncontrolledShow,
      mounted,
      onOpen,
      onClose,
      handleShowChange,
      sheetProgress,
      registerMethods,
      snapPoints,
      initialSnap,
      onSnapChangeProp,
      screenHeight,
      rubberBand,
      dragDisabled,
      dismissThreshold,
      handleOnly,
      enableDragToClose,
      presenceStateMTRef,
      claimedGestureAngles,
    ])

    return (
      <SheetContext.Provider value={contextValue}>
        {children}
      </SheetContext.Provider>
    )
  },
)
