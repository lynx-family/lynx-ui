// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  runOnBackground,
  runOnMainThread,
  useEffect,
  useMainThreadRef,
  useMemo,
  useRef,
} from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import { noop, useMemoizedFn } from '@lynx-js/lynx-ui-common'
import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { createMotionValue, useMotionValueRef } from '@lynx-js/motion/mini'
import type { MotionValue } from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'

import { useSheetAnimation } from './useSheetAnimation'
import { useSheetController } from './useSheetController'
import { useSheetSurfaceLayout } from './useSheetSurfaceLayout'
import type {
  SheetContentProps,
  SheetRootProps,
  SheetSide,
  SheetTransition,
} from '../types'
import {
  clamp,
  findNearestSnap,
  getDefaultRubberBand,
  getMainAxisLayoutSize,
  getMainAxisSize,
  getMaxSnapSize,
  getSheetTransform,
  isHorizontalSide,
  resolveSheetSide,
  toPxJS,
} from '../utils'

export interface SnappingOptions {
  animate?: boolean
  animationConfig?: SheetTransition
  isEntry?: boolean
}

export interface SnapOptions {
  snapPoints: Array<number | string>
  initialSnap?: number
  initialOpen?: boolean
  panelLayout?: SheetContentProps['panelLayout']
  snapAnimation?: SheetTransition
  side?: SheetSide
  enableRTL?: boolean
  screenHeight?: number
  screenWidth?: number
  rubberBand?: boolean | number | { coeff?: number, max?: number }
  onSnapChange?: (index: number, value: number) => void
  onSnapStartMT?: SheetRootProps['main-thread:onSnapStart']
  onDismiss?: () => void
  enterAnimation?: SheetTransition
  exitAnimation?: SheetTransition
  onBeforeDismiss?: (leavingEpoch?: number) => void
  onEntered?: () => void
  sheetProgress?: MainThreadRef<MotionValue<number>>
  onUnmount?: (closedEpoch?: number) => void
  onResurrected?: () => void
  presenceStateMTRef?: MainThreadRef<PresenceState>
  openEpochMTRef?: MainThreadRef<number>
}

export function useSnap({
  snapPoints = [],
  initialSnap = 0,
  initialOpen = false,
  panelLayout,
  snapAnimation = { type: 'spring', stiffness: 200, damping: 60 },
  side = 'bottom',
  enableRTL = false,
  screenHeight: userScreenHeight,
  screenWidth: userScreenWidth,
  rubberBand,
  onSnapChange = noop,
  onSnapStartMT,
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
  openEpochMTRef,
}: SnapOptions) {
  const resolvedSide = resolveSheetSide(side, enableRTL)
  const effectiveRubberBand = rubberBand ?? getDefaultRubberBand(resolvedSide)
  const allowOverDrag = effectiveRubberBand !== false
  const sheetMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const contentMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const yRef = useMotionValueRef<number>(0)
  const autoOpenedMTRef = useMainThreadRef(false)
  const closedBeforeOpenMTRef = useMainThreadRef(false)
  const btsReadyMTRef = useMainThreadRef(false)
  const hasQueuedBtsReadyRef = useRef(false)
  const bodySizeMTRef = useMainThreadRef<number>(-1)
  const footerHeightMTRef = useMainThreadRef<number>(-1)
  const footerMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const footerOffsetMTRef = useMainThreadRef<number | null>(null)
  const footerIdMTRef = useMainThreadRef<string | null>(null)
  const ownerMounted = useRef(true)
  useEffect(() => {
    ownerMounted.current = true
    return () => {
      ownerMounted.current = false
    }
  }, [])
  const fitSizeMTRef = useMainThreadRef<number>(0)
  const currentSnapIndex = useMainThreadRef<number>(initialSnap)
  const animateSurfaceChangesMTRef = useMainThreadRef(true)
  const {
    animateToMT,
    stopAnimationMT,
    interruptAnimationMT,
    resumeAnimationMT,
  } = useSheetAnimation(yRef, snapAnimation)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const screenHeight: number = userScreenHeight
    // @ts-expect-error expected
    ?? lynx.__globalProps?.screenHeight
    ?? 500
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const screenWidth: number = userScreenWidth
    // @ts-expect-error expected
    ?? lynx.__globalProps?.screenWidth
    ?? 375
  const viewportSize = getMainAxisSize(resolvedSide, {
    screenHeight,
    screenWidth,
  })

  const hasFitSnapPoint = useMemo(
    () => snapPoints.some(p => String(p).trim() === 'fit'),
    [snapPoints],
  )
  const snapPointsKey = snapPoints
    .map(p => `${toPxJS(p, viewportSize)}`)
    .join('|')
  // Keep snap points order stable: indices should match `snapPoints` order.
  const { snapPointValues, snapOffsets } = useMemo(() => {
    const values = snapPointsKey ? snapPointsKey.split('|').map(Number) : []
    const offsets = values.map(p => (p === -1 ? -1 : p))
    return { snapPointValues: values, snapOffsets: offsets }
  }, [snapPointsKey])

  const validOffsets = snapOffsets.filter(o => o !== -1)
  const minOffset = validOffsets.length > 0
    ? Math.min(...validOffsets)
    : 0
  const maxOffset = validOffsets.length > 0
    ? Math.max(...validOffsets)
    : 0
  const maxSnapSize = getMaxSnapSize(snapPointValues)
  // Seed initial resolved snap values so MTS can open immediately on ref attach
  // without waiting for a BTS useEffect -> runOnMainThread round-trip.
  const sheetSizeMTRef = useMainThreadRef<number>(
    hasFitSnapPoint ? 0 : maxSnapSize,
  )
  const resolvedSnapPointMTRef = useMainThreadRef<number[]>(snapPointValues)
  const resolvedSnapOffsetsMTRef = useMainThreadRef<number[]>(snapOffsets)
  const contentSizeMTRef = useMainThreadRef<number>(
    hasFitSnapPoint ? 0 : maxSnapSize,
  )

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
    return clamp(targetY, Math.max(sheetSizeMTRef.current, maxSnap))
  }

  function setContentMTRef(el: MainThread.Element) {
    'main thread'
    contentMTRef.current = el
  }

  function updateContentSizeMT(size: number) {
    'main thread'
    contentSizeMTRef.current = size
    const el = contentMTRef.current
    if (!el) return
    if (isHorizontalSide(resolvedSide)) {
      el.setStyleProperties({
        width: `${size}px`,
      })
    } else if (hasFitSnapPoint) {
      el.setStyleProperties({
        height: `${size}px`,
      })
    }
  }

  function updateFooterPositionMT(visibleHeight: number) {
    'main thread'
    const footer = footerMTRef.current
    if (!footer) return
    const offset = Math.max(
      0,
      visibleHeight - Math.max(0, footerHeightMTRef.current),
    )
    if (footerOffsetMTRef.current === offset) return
    footerOffsetMTRef.current = offset
    footer.setStyleProperties({
      transform: `translateY(${offset}px)`,
    })
  }

  function handleMotionValueChangeMT(v: number) {
    'main thread'
    updateFooterPositionMT(v)
    const el = sheetMTRef.current
    if (el) {
      const offsets = getResolvedSnapOffsets()
      const maxSnap = offsets.length > 0 ? Math.max(...offsets) : 0
      const opened = Math.max(sheetSizeMTRef.current, maxSnap)
      const transformValue = isHorizontalSide(resolvedSide) && !allowOverDrag
        ? Math.min(v, opened)
        : v
      if (isHorizontalSide(resolvedSide)) {
        el.setStyleProperties({
          transform: getSheetTransform(resolvedSide, transformValue),
        })
      }
      if (sheetProgress) {
        if (!sheetProgress.current) {
          sheetProgress.current = createMotionValue(0)
        }
        const closed = 0
        let progress = 1
        if (v < opened && opened > 0) {
          progress = (v - closed) / (opened - closed)
        }
        sheetProgress.current.set(Math.max(0, Math.min(1, progress)))
      }
    }
  }

  function onSnapChangeMT(index: number, value: number) {
    'main thread'
    if (currentSnapIndex.current !== index) {
      currentSnapIndex.current = index
      runOnBackground(onSnapChange)(index, value)
    }
  }

  function nearestSnapMT(value: number) {
    'main thread'
    const offsets = getResolvedSnapOffsets()
    const maxSnap = offsets.length > 0 ? Math.max(...offsets) : 0
    return findNearestSnap(
      value,
      offsets,
      Math.max(sheetSizeMTRef.current, maxSnap),
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
      openEpochMTRef,
    },
    {
      animateToMT,
      yRef,
      stopAnimationMT,
      getTargetForSnap,
      getResolvedSnapPointValues,
      onSnapChangeMT,
      onSnapStartMT: (index, value, animated) => {
        'main thread'
        animateSurfaceChangesMTRef.current = animated
        onSnapStartMT?.(index, value, animated)
      },
      onOpeningMT: () => {
        'main thread'
        closedBeforeOpenMTRef.current = false
      },
      onClosedBeforeEntryMT: () => {
        'main thread'
        closedBeforeOpenMTRef.current = true
      },
      enterAnimation,
      exitAnimation,
      initialSnap,
    },
  )

  function onSurfaceReadyMT() {
    'main thread'
    if (!initialOpen) {
      autoOpenedMTRef.current = false
      return
    }
    if (
      !btsReadyMTRef.current
      || autoOpenedMTRef.current
      || closedBeforeOpenMTRef.current
    ) {
      return
    }
    autoOpenedMTRef.current = true
    controller.showMT()
  }

  const surfaceLayout = useSheetSurfaceLayout({
    position: yRef,
    animateChanges: animateSurfaceChangesMTRef,
    presence: controller.presenceStateMTRef,
    resolvedSide,
    panelLayout,
    screenHeight,
    maxSnapSize,
    hasFitSnapPoint,
    movingSurfaceMTRef: sheetMTRef,
    initialSize: getTargetForSnap,
    initialSnap,
    snapAnimation,
    onSurfaceReadyMT,
    onMotionValueChangeMT: handleMotionValueChangeMT,
  })

  function markBtsReadyMT() {
    'main thread'
    btsReadyMTRef.current = true
    if (surfaceLayout.isSurfaceReadyMT()) {
      onSurfaceReadyMT()
    }
  }

  const isLepus = typeof __LEPUS__ !== 'undefined' && __LEPUS__
  if (!hasQueuedBtsReadyRef.current && !isLepus) {
    hasQueuedBtsReadyRef.current = true
    runOnMainThread(markBtsReadyMT)()
  }

  const snapSyncKey = `${viewportSize}|${
    String(hasFitSnapPoint)
  }|${snapPointsKey}|${maxSnapSize}`
  const lastSnapSyncKeyRef = useRef(snapSyncKey)

  useEffect(() => {
    if (lastSnapSyncKeyRef.current === snapSyncKey) {
      return
    }
    lastSnapSyncKeyRef.current = snapSyncKey
    runOnMainThread((values: number[], nextMax: number) => {
      'main thread'
      resolvedSnapPointMTRef.current = values.map(value =>
        value === -1 && fitSizeMTRef.current > 0
          ? fitSizeMTRef.current
          : value
      )
      resolvedSnapOffsetsMTRef.current = resolvedSnapPointMTRef.current
      if (!hasFitSnapPoint) {
        sheetSizeMTRef.current = nextMax
        updateContentSizeMT(nextMax)
      }
    })(snapPointValues, maxSnapSize)
  }, [snapSyncKey, hasFitSnapPoint, snapPointValues, maxSnapSize])

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

  function releaseAtMaxSnapMT(index: number) {
    'main thread'
    // The content owns the gesture, so the Sheet has no release velocity.
    yRef.current.updateVelocity(0)
    controller.snapToMT(index)
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

  function handleSheetLayoutChangeMT(
    e: {
      detail?: { height?: number, width?: number }
      params?: { height?: number, width?: number }
    },
    allowEmptyFit = false,
  ) {
    'main thread'

    const previousFit = getResolvedSnapOffsets()[currentSnapIndex.current]
    const bodySize = getMainAxisLayoutSize(resolvedSide, e)
    bodySizeMTRef.current = bodySize
    const layoutSize = !hasFitSnapPoint && !isHorizontalSide(resolvedSide)
      ? maxSnapSize
      : bodySize + (hasFitSnapPoint && resolvedSide === 'bottom'
        ? Math.max(0, footerHeightMTRef.current)
        : 0)
    sheetSizeMTRef.current = layoutSize

    // The rename is required, to prevent from xx.map is not a function
    const innerSnapPointValues = snapPointValues
    const innerSnapOffsets = snapOffsets

    if (hasFitSnapPoint) {
      if (!allowEmptyFit && fitSizeMTRef.current === 0 && layoutSize <= 0) {
        return
      }
      const fitSize = layoutSize > 0 || allowEmptyFit
        ? layoutSize
        : fitSizeMTRef.current
      fitSizeMTRef.current = fitSize
      resolvedSnapPointMTRef.current = innerSnapPointValues.map(v =>
        v === -1 ? fitSize : v
      )
      resolvedSnapOffsetsMTRef.current = innerSnapOffsets.map(o =>
        o === -1 ? fitSize : o
      )
      // Resolve any pending snap operation
      controller.resolvePendingSnapMT()
      // Intrinsic body and footer changes must resize an idle fit panel too.
      if (
        snapPointValues[currentSnapIndex.current] === -1
        && previousFit !== undefined && previousFit >= 0
        && Math.abs(fitSize - previousFit) >= 0.5
      ) {
        const state = controller.presenceStateMTRef.current
        if (
          state === PresenceState.Entered && !yRef.current.isAnimating()
          && Math.abs(yRef.current.get() - previousFit) < 0.5
        ) {
          controller.snapToMT(currentSnapIndex.current, { animate: false })
        } else if (
          state === PresenceState.Entering && yRef.current.isAnimating()
        ) {
          controller.snapToMT(currentSnapIndex.current, { isEntry: true })
        }
      }
    } else if (contentSizeMTRef.current !== maxSnapSize) {
      updateContentSizeMT(maxSnapSize)
    }
  }

  function updateFooterHeightMT(height: number) {
    'main thread'
    const previousHeight = footerHeightMTRef.current
    footerHeightMTRef.current = height
    updateFooterPositionMT(yRef.current.get())
    if (hasFitSnapPoint && bodySizeMTRef.current >= 0) {
      handleSheetLayoutChangeMT(
        { detail: { height: bodySizeMTRef.current } },
        previousHeight > 0 && height === 0 && bodySizeMTRef.current === 0,
      )
    }
  }

  function registerFooterMT(id: string, height: number) {
    'main thread'
    const element = sheetMTRef.current?.querySelector(`#${id}`)
    if (!element || !yRef.current) return
    footerIdMTRef.current = id
    if (footerMTRef.current !== element) footerOffsetMTRef.current = null
    footerMTRef.current = element
    updateFooterHeightMT(height)
  }

  function unregisterFooterMT(id: string) {
    'main thread'
    if (footerIdMTRef.current !== id || !yRef.current) return
    footerIdMTRef.current = null
    footerMTRef.current = null
    footerOffsetMTRef.current = null
    updateFooterHeightMT(0)
  }

  const registerFooter = useMemoizedFn((id: string, height: number) => {
    if (ownerMounted.current) runOnMainThread(registerFooterMT)(id, height)
  })
  const unregisterFooter = useMemoizedFn((id: string) => {
    if (ownerMounted.current) runOnMainThread(unregisterFooterMT)(id)
  })

  return {
    footerContext: {
      resolvedSide,
      registerFooter,
      unregisterFooter,
    },
    setContentMTRef,
    ...surfaceLayout,
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
    side,
    enableRTL,
    screenHeight,
    screenWidth,
    viewportSize,
    snapOffsets,
    snapPointValues,
    minOffset,
    maxOffset,
    maxSnapSize,
    getClampedValueMT,
    animateToMT,
    interruptAnimationMT,
    resumeAnimationMT,
    nearestSnapMT,
    sheetHeightMTRef: sheetSizeMTRef,
    sheetSizeMTRef,
    // Getters for resolved snapPoints (after 'fit' is resolved)
    getResolvedSnapOffsets,
    getResolvedSnapPointValues,
    handleSheetLayoutChangeMT,
    // Controller exports for gesture handling
    presenceStateMTRef: controller.presenceStateMTRef,
    onDragStartMT: controller.onDragStartMT,
    onDragEndSnapMT: controller.onDragEndSnapMT,
    onDragEndCloseMT: controller.onDragEndCloseMT,
    releaseAtMaxSnapMT,
  }
}
