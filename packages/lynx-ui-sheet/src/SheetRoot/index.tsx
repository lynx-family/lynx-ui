// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  forwardRef,
  runOnMainThread,
  useCallback,
  useImperativeHandle,
  useMainThreadRef,
  useMemo,
  useReducer,
  useRef,
  useState,
} from '@lynx-js/react'

import { useMemoizedFn } from '@lynx-js/lynx-ui-common'
import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { useMotionValueRef } from '@lynx-js/motion/mini'

import { SheetContext } from '../context'
import type { SheetMethods } from '../context'
import type { SheetRootProps, SheetRootRef } from '../types'
import { resolveSheetSide } from '../utils'

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
      'main-thread:onSnapStart': onSnapStartMT,
      'main-thread:onDragStart': onDragStartMT,
      'main-thread:onPositionChange': onPositionChangeMT,
      'main-thread:onPresenceChange': onPresenceChangeMT,
      side = 'bottom',
      enableRTL = false,
      screenHeight,
      screenWidth,
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
    const resolvedSide = resolveSheetSide(side, enableRTL)

    const isControlled = show !== undefined
    const [uncontrolledShow, setUncontrolledShow] = useState<boolean>(
      defaultShow,
    )
    const actualShow = isControlled ? show : uncontrolledShow
    const openEpochMTRef = useMainThreadRef<number>(actualShow ? 1 : 0)

    function syncOpenEpochMT(epoch: number) {
      'main thread'
      openEpochMTRef.current = epoch
    }

    const [, forceRender] = useReducer((count: number) => count + 1, 0)
    // Store registered methods from SheetContent
    const sheetMethodsRef = useRef<SheetMethods | null>(null)
    const positionerSizeCacheRef = useRef<
      { hostKey: string, width: number, height: number } | null
    >(null)
    const pendingActionsRef = useRef<Array<() => void>>([])
    const openEpochRef = useRef<number>(actualShow ? 1 : 0)
    const prevActualShowRef = useRef<boolean>(Boolean(actualShow))
    const latestUncontrolledShowRef = useRef<boolean>(defaultShow)
    latestUncontrolledShowRef.current = uncontrolledShow
    const pendingEmittedShowRef = useRef<boolean | null>(null)
    const pendingEmissionIdRef = useRef<number>(0)
    const latchedMountedRef = useRef<boolean>(Boolean(actualShow))
    if (actualShow && !prevActualShowRef.current) {
      const nextEpoch = ++openEpochRef.current
      latchedMountedRef.current = true
      const isLepus = typeof __LEPUS__ !== 'undefined' && __LEPUS__
      if (!isLepus) {
        runOnMainThread(syncOpenEpochMT)(nextEpoch)
      }
    }
    prevActualShowRef.current = Boolean(actualShow)
    // Mount SheetView synchronously on the rising edge when `show` becomes true
    // without scheduling a follow-up `setMounted(true)` render; only `onUnmount`
    // (or imperative open from unmounted) triggers `forceRender()`.
    const effectiveMounted = latchedMountedRef.current

    const handleShowChange = useMemoizedFn((newShow: boolean) => {
      const committedShow = isControlled
        ? show
        : latestUncontrolledShowRef.current
      const effectiveShow = pendingEmittedShowRef.current ?? committedShow
      if (newShow === effectiveShow) return
      const emissionId = ++pendingEmissionIdRef.current
      pendingEmittedShowRef.current = newShow
      void Promise.resolve().then(() => {
        if (pendingEmissionIdRef.current === emissionId) {
          pendingEmittedShowRef.current = null
        }
      })
      if (!isControlled) {
        latestUncontrolledShowRef.current = newShow
        setUncontrolledShow(newShow)
      }
      onShowChange?.(newShow)
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
        if (effectiveMounted && sheetMethodsRef.current) {
          action()
        } else {
          const wasMounted = latchedMountedRef.current
          latchedMountedRef.current = true
          if (!wasMounted) forceRender()
          pendingActionsRef.current.push(action)
        }
      }

      const beginImperativeOpen = (action: () => void) => {
        const nextEpoch = ++openEpochRef.current
        const wasMounted = latchedMountedRef.current
        latchedMountedRef.current = true
        if (!wasMounted) forceRender()
        runOnMainThread(syncOpenEpochMT)(nextEpoch)
        handleShowChange(true)
        queueAction(action)
      }

      return {
        snapTo: (index, opts) => {
          beginImperativeOpen(() =>
            sheetMethodsRef.current?.snapTo(index, opts)
          )
        },
        expand: (opts) => {
          beginImperativeOpen(() => sheetMethodsRef.current?.expand(opts))
        },
        collapse: (opts) => {
          beginImperativeOpen(() => sheetMethodsRef.current?.collapse(opts))
        },
        close: (opts) => {
          handleShowChange(false)
          if (effectiveMounted || latchedMountedRef.current || actualShow) {
            queueAction(() => sheetMethodsRef.current?.close(opts))
          }
        },
        open: (opts) => {
          beginImperativeOpen(() => sheetMethodsRef.current?.show?.(opts))
        },
      }
    }, [handleShowChange, effectiveMounted, actualShow])

    const autoOpen = actualShow && pendingActionsRef.current.length === 0

    const isCurrentOpenEpoch = useCallback(
      (epoch?: number) => epoch === undefined || epoch === openEpochRef.current,
      [],
    )

    const contextValue = useMemo(() => ({
      show: actualShow,
      autoOpen,
      forceMount,
      setUncontrolledShow,
      groupState: PresenceState.Entered, // Obsolete, keeping for type/compat if needed or remove
      mounted: effectiveMounted,
      isCurrentOpenEpoch,
      onUnmount: (closedEpoch?: number) => {
        if (!isCurrentOpenEpoch(closedEpoch)) {
          return
        }
        if (!latchedMountedRef.current) {
          return
        }
        latchedMountedRef.current = false
        forceRender()
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
      onSnapStartMT,
      onDragStartMT,
      onPositionChangeMT,
      onPresenceChangeMT,
      side,
      enableRTL,
      resolvedSide,
      screenHeight,
      screenWidth,
      // Gesture
      rubberBand,
      dragDisabled,
      dismissThreshold,
      handleOnly,
      enableDragToClose,
      presenceStateMTRef,
      openEpochMTRef,
      claimedGestureAngles,
      positionerSizeCacheRef,
    }), [
      actualShow,
      autoOpen,
      forceMount,
      setUncontrolledShow,
      effectiveMounted,
      isCurrentOpenEpoch,
      onOpen,
      onClose,
      handleShowChange,
      sheetProgress,
      registerMethods,
      snapPoints,
      initialSnap,
      onSnapChangeProp,
      onSnapStartMT,
      onDragStartMT,
      onPositionChangeMT,
      onPresenceChangeMT,
      side,
      enableRTL,
      resolvedSide,
      screenHeight,
      screenWidth,
      rubberBand,
      dragDisabled,
      dismissThreshold,
      handleOnly,
      enableDragToClose,
      presenceStateMTRef,
      openEpochMTRef,
      claimedGestureAngles,
    ])

    return (
      <SheetContext.Provider value={contextValue}>
        {children}
      </SheetContext.Provider>
    )
  },
)
