// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  runOnBackground,
  runOnMainThread,
  useMainThreadRef,
  useMemo,
} from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import { noop, useMemoizedFn } from '@lynx-js/lynx-ui-common'
import type { PresenceState } from '@lynx-js/lynx-ui-presence'
import {
  animate,
  useMotionValueRef,
  useMotionValueRefEvent,
} from '@lynx-js/motion/mini'
import type { MotionValue } from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'

import { useSheetController } from './useSheetController'
import type { SheetTransition } from '../types'
import { clamp, findNearestSnap, toPxJS } from '../utils'

export interface SnappingOptions {
  animate?: boolean
  animationConfig?: SheetTransition
  isEntry?: boolean
}

export interface SnapOptions {
  snapPoints: Array<number | string>
  initialSnap?: number
  snapAnimation?: SheetTransition
  screenHeight?: number
  onSnapChange?: (index: number, value: number) => void
  onDismiss?: () => void
  enterAnimation?: SheetTransition
  exitAnimation?: SheetTransition
  onBeforeDismiss?: () => void
  onEntered?: () => void
  sheetProgress?: MainThreadRef<MotionValue<number>>
  onUnmount?: () => void
  onResurrected?: () => void
  presenceStateMTRef?: MainThreadRef<PresenceState>
}

export function useSnap({
  snapPoints = [],
  initialSnap = 0,
  snapAnimation = { type: 'spring', stiffness: 200, damping: 60 },
  screenHeight: userScreenHeight,
  onSnapChange = noop,
  onDismiss,
  enterAnimation = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 1,
  },
  exitAnimation = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 1,
  },
  onBeforeDismiss,
  onEntered,
  sheetProgress,
  onUnmount,
  onResurrected,
  presenceStateMTRef: presenceStateMTRefProp,
}: SnapOptions) {
  const sheetMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const yRef = useMotionValueRef<number>(0)
  const sheetHeightMTRef = useMainThreadRef<number>(0)
  const currentSnapIndex = useMainThreadRef<number>(initialSnap)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const screenHeight: number = userScreenHeight
    // @ts-expect-error expected
    ?? lynx.__globalProps?.screenHeight
    ?? 500

  // Track resolved snapPoints (for 'fit' support)
  const resolvedSnapPointMTRef = useMainThreadRef<number[]>([])
  const resolvedSnapOffsetsMTRef = useMainThreadRef<number[]>([])
  const hasFitSnapPoint = useMemo(
    () => snapPoints.some(p => String(p).trim() === 'fit'),
    [snapPoints],
  )

  // Keep snap points order stable: indices should match `snapPoints` order.
  const { snapPointValues, snapOffsets } = useMemo(() => {
    const values = snapPoints.map(p => toPxJS(p, screenHeight))
    const offsets = values.map(p => (p === -1 ? -1 : p))
    return { snapPointValues: values, snapOffsets: offsets }
  }, [snapPoints, screenHeight])

  const validOffsets = snapOffsets.filter(o => o !== -1)
  const minOffset = validOffsets.length > 0
    ? Math.min(...validOffsets)
    : 0
  const maxOffset = validOffsets.length > 0
    ? Math.max(...validOffsets)
    : 0

  function getResolvedSnapOffsets() {
    'main thread'
    return resolvedSnapOffsetsMTRef.current.length > 0
      ? resolvedSnapOffsetsMTRef.current
      : snapOffsets
  }

  function getResolvedSnapPointValues() {
    'main thread'
    return resolvedSnapPointMTRef.current.length > 0
      ? resolvedSnapPointMTRef.current
      : snapPointValues
  }

  function getClampedValueMT(targetY: number) {
    'main thread'
    const offsets = getResolvedSnapOffsets()
    const maxSnap = offsets.length > 0 ? Math.max(...offsets) : 0
    // Allow snapping up to the max snap point, even if content is shorter
    return clamp(targetY, Math.max(sheetHeightMTRef.current, maxSnap))
  }

  function setSheetMTRef(el: MainThread.Element) {
    'main thread'
    sheetMTRef.current = el
  }

  useMotionValueRefEvent(yRef, 'change', v => {
    'main thread'
    const el = sheetMTRef.current
    if (el) {
      el.setStyleProperties({
        transform: `translate(0px, ${-v}px)`,
        transition: 'none',
      })
      if (sheetProgress?.current) {
        const offsets = getResolvedSnapOffsets()
        const maxSnap = offsets.length > 0 ? Math.max(...offsets) : 0
        const opened = Math.max(sheetHeightMTRef.current, maxSnap)
        const closed = 0
        let progress = 1
        if (v < opened && opened > 0) {
          progress = (v - closed) / (opened - closed)
        }
        sheetProgress.current.set(Math.max(0, Math.min(1, progress)))
      }
    }
  })

  function onSnapChangeMT(index: number, value: number) {
    'main thread'
    if (currentSnapIndex.current !== index) {
      currentSnapIndex.current = index
      runOnBackground(onSnapChange)(index, value)
    }
  }

  function animateToMT(
    value: number,
    cb: () => void = noop,
    config?: SheetTransition,
  ) {
    'main thread'
    const finalConfig = config ?? snapAnimation
    if (finalConfig.type === 'spring') {
      animate(yRef.current, value, {
        type: 'spring',
        stiffness: finalConfig.stiffness ?? 200,
        damping: finalConfig.damping ?? 60,
        mass: finalConfig.mass ?? 1,
      }).then(cb)
    } else {
      animate(yRef.current, value, {
        duration: (finalConfig.duration ?? 400) / 1000,
        ease: finalConfig.ease ?? (t => t),
      }).then(cb)
    }
  }

  function nearestSnapMT(value: number) {
    'main thread'
    const offsets = getResolvedSnapOffsets()
    const maxSnap = offsets.length > 0 ? Math.max(...offsets) : 0
    return findNearestSnap(
      value,
      offsets,
      Math.max(sheetHeightMTRef.current, maxSnap),
    )
  }

  /**
   * Get the target Y position for a snap index
   */
  function getTargetForSnap(index: number) {
    'main thread'
    const offsets = getResolvedSnapOffsets()
    if (offsets.length === 0) return -1
    const i = Math.max(0, Math.min(index, offsets.length - 1))
    if (offsets[i] === -1) return -1
    return getClampedValueMT(offsets[i])
  }

  // Create controller with animation dependencies
  const controller = useSheetController(
    {
      onEntered,
      onDismiss,
      onUnmount,
      onBeforeDismiss,
      onResurrected,
      presenceStateMTRef: presenceStateMTRefProp,
    },
    {
      yRef,
      animateToMT,
      getTargetForSnap,
      getResolvedSnapPointValues,
      onSnapChangeMT,
      enterAnimation,
      exitAnimation,
      initialSnap,
    },
  )

  // Controller-delegated MT functions
  function expandMT(opts?: SnappingOptions) {
    'main thread'
    const offsets = getResolvedSnapOffsets()
    const valid = offsets.filter(o => o !== -1)
    if (valid.length === 0) return
    const maxVal = Math.max(...valid)
    const idx = offsets.indexOf(maxVal)
    if (idx !== -1) {
      controller.snapToMT(idx, opts)
    }
  }

  function collapseMT(opts?: SnappingOptions) {
    'main thread'
    const offsets = getResolvedSnapOffsets()
    const valid = offsets.filter(o => o !== -1)
    if (valid.length === 0) return
    const minVal = Math.min(...valid)
    const idx = offsets.indexOf(minVal)
    if (idx !== -1) {
      controller.snapToMT(idx, opts)
    }
  }

  // Background wrappers
  const snapTo = useMemoizedFn(
    (
      index: number,
      opts?: SnappingOptions,
    ) => {
      runOnMainThread(controller.snapToMT)(index, opts)
    },
  )

  const expand = useMemoizedFn(
    (opts?: { animate?: boolean, animationConfig?: SheetTransition }) => {
      runOnMainThread(expandMT)(opts)
    },
  )

  const collapse = useMemoizedFn(
    (opts?: { animate?: boolean, animationConfig?: SheetTransition }) => {
      runOnMainThread(collapseMT)(opts)
    },
  )

  const close = useMemoizedFn(
    (opts?: { animate?: boolean, animationConfig?: SheetTransition }) => {
      runOnMainThread(controller.closeMT)(opts)
    },
  )

  const show = useMemoizedFn(
    (opts?: SnappingOptions) => {
      runOnMainThread(controller.showMT)(opts)
    },
  )

  function handleSheetLayoutChangeMT(e: { detail: { height: number } }) {
    'main thread'

    const height = e.detail.height ?? 0
    sheetHeightMTRef.current = height

    // The rename is required, to prevent from xx.map is not a function
    const innerSnapPointValues = snapPointValues
    const innerSnapOffsets = snapOffsets

    if (hasFitSnapPoint) {
      resolvedSnapPointMTRef.current = innerSnapPointValues.map(v =>
        v === -1 ? height : v
      )
      resolvedSnapOffsetsMTRef.current = innerSnapOffsets.map(o =>
        o === -1 ? height : o
      )

      // Resolve any pending snap operation
      controller.resolvePendingSnapMT()
    }
  }

  return {
    setSheetMTRef,
    snapTo,
    expand,
    collapse,
    close,
    show,
    // MT functions from controller
    snapToMT: controller.snapToMT,
    expandMT,
    collapseMT,
    closeMT: controller.closeMT,
    showMT: controller.showMT,
    // internals for gesture hook
    yRef,
    screenHeight,
    snapOffsets,
    snapPointValues,
    minOffset,
    maxOffset,
    getClampedValueMT,
    animateToMT,
    nearestSnapMT,
    onSnapChangeMT,
    sheetHeightMTRef,
    // Getters for resolved snapPoints (after 'fit' is resolved)
    getResolvedSnapOffsets,
    getResolvedSnapPointValues,
    handleSheetLayoutChangeMT,
    // Controller exports for gesture handling
    presenceStateMTRef: controller.presenceStateMTRef,
    onDragStartMT: controller.onDragStartMT,
    onDragEndSnapMT: controller.onDragEndSnapMT,
    onDragEndCloseMT: controller.onDragEndCloseMT,
  }
}
