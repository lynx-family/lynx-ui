// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  runOnBackground,
  runOnMainThread,
  useEffect,
  useMainThreadRef,
  useMemo,
} from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import { noop, useMemoizedFn } from '@lynx-js/lynx-ui-common'
import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { useMotionValueRef, useMotionValueRefEvent } from '@lynx-js/motion/mini'
import type { MotionValue } from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'

import type { SheetLayoutRect, SheetPositionerDimensions } from '../context'
import { useSheetAnimation } from './useSheetAnimation'
import { useSheetController } from './useSheetController'
import { normalizeInset, useSheetSurfaceLayout } from './useSheetSurfaceLayout'
import type {
  SheetContentProps,
  SheetCornerRadius,
  SheetInsets,
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
  cornerRadius?: SheetCornerRadius
  insets?: SheetInsets
  hasController?: boolean
  surfaceStyle?: SheetContentProps['style']
  snapAnimation?: SheetTransition
  side?: SheetSide
  enableRTL?: boolean
  screenHeight?: number
  screenWidth?: number
  positioner?: SheetPositionerDimensions | null
  rubberBand?: boolean | number | { coeff?: number, max?: number }
  onSnapChange?: (index: number, value: number) => void
  onSnapStartMT?: SheetRootProps['main-thread:onSnapStart']
  onDragStartMT?: SheetRootProps['main-thread:onDragStart']
  onPositionChangeMT?: SheetRootProps['main-thread:onPositionChange']
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
  cornerRadius,
  insets,
  hasController = false,
  surfaceStyle,
  snapAnimation = { type: 'spring', stiffness: 200, damping: 60 },
  side = 'bottom',
  enableRTL = false,
  screenHeight: userScreenHeight,
  screenWidth: userScreenWidth,
  positioner,
  rubberBand,
  onSnapChange = noop,
  onSnapStartMT,
  onDragStartMT: onDragStartNotifyMT,
  onPositionChangeMT,
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
  const resolvedSide = resolveSheetSide(side, enableRTL)
  const effectiveRubberBand = rubberBand ?? getDefaultRubberBand(resolvedSide)
  const allowOverDrag = effectiveRubberBand !== false
  const sheetMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const contentMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const yRef = useMotionValueRef<number>(0)
  const sheetSizeMTRef = useMainThreadRef<number>(0)
  const bodySizeMTRef = useMainThreadRef<number>(-1)
  const footerHeightMTRef = useMainThreadRef<number>(-1)
  const footerMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const footerOffsetMTRef = useMainThreadRef<number | null>(null)
  const surfaceLifecycleMTRef = useMainThreadRef<
    { open: () => void, settle: () => void } | null
  >(null)
  const contentSizeMTRef = useMainThreadRef<number>(0)
  const fitSizeMTRef = useMainThreadRef<number>(0)
  const fitMeasuredMTRef = useMainThreadRef(false)
  const currentSnapIndex = useMainThreadRef<number>(initialSnap)
  const {
    animateToMT,
    stopAnimationMT,
    interruptAnimationMT,
    resumeAnimationMT,
    retargetAnimationMT,
  } = useSheetAnimation(yRef, snapAnimation)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const screenHeight: number = positioner?.height ?? userScreenHeight
    // @ts-expect-error expected
    ?? lynx.__globalProps?.screenHeight
    ?? 500
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const screenWidth: number = positioner?.width ?? userScreenWidth
    // @ts-expect-error expected
    ?? lynx.__globalProps?.screenWidth
    ?? 375
  const propBottom = normalizeInset(insets?.bottom)
  const openingBottomMTRef = useMainThreadRef(propBottom)
  const viewportSize = getMainAxisSize(resolvedSide, {
    screenHeight,
    screenWidth,
  })

  // Track resolved snapPoints (for 'fit' support)
  const resolvedSnapPointMTRef = useMainThreadRef<number[]>([])
  const resolvedSnapOffsetsMTRef = useMainThreadRef<number[]>([])
  const hasFitSnapPoint = useMemo(
    () => snapPoints.some(p => String(p).trim() === 'fit'),
    [snapPoints],
  )
  // Keep snap points order stable: indices should match `snapPoints` order.
  const { snapPointValues, snapOffsets } = useMemo(() => {
    const values = snapPoints.map(p => toPxJS(p, viewportSize))
    const offsets = values.map(p => (p === -1 ? -1 : p))
    return { snapPointValues: values, snapOffsets: offsets }
  }, [snapPoints, viewportSize])

  const validOffsets = snapOffsets.filter(o => o !== -1)
  const minOffset = validOffsets.length > 0
    ? Math.min(...validOffsets)
    : 0
  const maxOffset = validOffsets.length > 0
    ? Math.max(...validOffsets)
    : 0
  const maxSnapSize = getMaxSnapSize(snapPointValues)

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
    } else {
      el.setStyleProperties({
        height: hasFitSnapPoint ? `${size}px` : '100%',
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
    footer.setStyleProperties({ transform: `translateY(${offset}px)` })
  }

  useMotionValueRefEvent(yRef, 'change', v => {
    'main thread'
    onPositionChangeMT?.(Math.max(0, v))
    if (resolvedSide !== 'bottom') updateFooterPositionMT(v)
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
      if (sheetProgress?.current) {
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

  function getFitLayoutSizeMT(bodySize: number) {
    'main thread'
    if (resolvedSide !== 'bottom') return bodySize
    const bottom = hasController ? openingBottomMTRef.current : propBottom
    return Math.min(
      bodySize + Math.max(0, footerHeightMTRef.current),
      Math.max(0, screenHeight - bottom),
    )
  }

  function storeFitSizeMT(size: number) {
    'main thread'
    fitSizeMTRef.current = size
    fitMeasuredMTRef.current = true
    const values = snapPointValues
    const offsets = snapOffsets
    resolvedSnapPointMTRef.current = values.map(value =>
      value === -1 ? size : value
    )
    resolvedSnapOffsetsMTRef.current = offsets.map(offset =>
      offset === -1 ? size : offset
    )
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
      animateToMT,
      yRef,
      stopAnimationMT,
      getTargetForSnap,
      getResolvedSnapPointValues,
      onSnapChangeMT,
      onSnapStartMT,
      onDragStartNotifyMT,
      onOpeningMT: () => {
        'main thread'
        if (!hasController) return
        openingBottomMTRef.current = propBottom
        if (hasFitSnapPoint && fitMeasuredMTRef.current) {
          const size = getFitLayoutSizeMT(bodySizeMTRef.current)
          sheetSizeMTRef.current = size
          storeFitSizeMT(size)
        }
        surfaceLifecycleMTRef.current?.open()
      },
      onSettledMT: () => {
        'main thread'
        surfaceLifecycleMTRef.current?.settle()
      },
      enterAnimation,
      exitAnimation,
      initialSnap,
      retargetAnimationMT: positioner ? retargetAnimationMT : undefined,
    },
  )

  function resolveFitSnapMT(
    bodySize: number,
    allowEmptyFit = false,
  ) {
    'main thread'
    const previousOffsets = getResolvedSnapOffsets()
    const previousFit = previousOffsets[currentSnapIndex.current]
    bodySizeMTRef.current = bodySize
    const measuredSize = bodySize + (resolvedSide === 'bottom'
      ? Math.max(0, footerHeightMTRef.current)
      : 0)
    const layoutSize = getFitLayoutSizeMT(bodySize)
    sheetSizeMTRef.current = layoutSize

    if (!allowEmptyFit && fitSizeMTRef.current === 0 && measuredSize <= 0) {
      return
    }
    const fitSize = measuredSize > 0 || allowEmptyFit
      ? layoutSize
      : fitSizeMTRef.current
    storeFitSizeMT(fitSize)
    controller.resolvePendingSnapMT()
    if (positioner) {
      controller.reconcileSnapMT(previousOffsets)
      return
    }
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
  }

  function resolveIntrinsicBodyMT(height: number) {
    'main thread'
    resolveFitSnapMT(height, fitMeasuredMTRef.current)
  }

  const surfaceLayout = useSheetSurfaceLayout({
    position: yRef,
    presence: controller.presenceStateMTRef,
    resolvedSide,
    enableRTL,
    cornerRadius,
    insets,
    hasController,
    surfaceStyle,
    screenHeight,
    screenWidth,
    allowOverDrag,
    sheetSizeMTRef,
    movingSurfaceMTRef: sheetMTRef,
    maxSnapSize,
    hasFitSnapPoint,
    onFitBodyLayoutMT: resolveIntrinsicBodyMT,
    footerHeightMTRef,
    updateFooterPositionMT,
    initialSize: getTargetForSnap,
    initialSnap,
    surfaceLifecycleMTRef,
  })

  const { measureBodyParentMT, hasFitBodyMT, updateSurfaceMT } = surfaceLayout

  useEffect(() => {
    runOnMainThread((values: number[], nextMax: number, local: boolean) => {
      'main thread'
      if (
        resolvedSide === 'bottom' && hasFitSnapPoint && fitMeasuredMTRef.current
      ) {
        // A height-only viewport change can update the cap with cached content.
        resolveIntrinsicBodyMT(bodySizeMTRef.current)
        return
      }
      if (!local) return
      const previousOffsets = getResolvedSnapOffsets()
      resolvedSnapPointMTRef.current = values.map(value =>
        value === -1 && fitMeasuredMTRef.current
          ? fitSizeMTRef.current
          : value
      )
      resolvedSnapOffsetsMTRef.current = resolvedSnapPointMTRef.current
      if (!hasFitSnapPoint) {
        sheetSizeMTRef.current = nextMax
        updateContentSizeMT(nextMax)
      }
      controller.reconcileSnapMT(previousOffsets)
    })(snapPointValues, maxSnapSize, !!positioner)
  }, [
    screenWidth,
    screenHeight,
    hasController,
    propBottom,
    hasFitSnapPoint,
    resolvedSide,
    positioner,
    snapPointValues,
    maxSnapSize,
  ])

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

  function handleSheetLayoutChangeMT(e: {
    detail?: Partial<SheetLayoutRect>
    params?: Partial<SheetLayoutRect>
  }) {
    'main thread'
    measureBodyParentMT(e.detail ?? e.params)
    if (hasFitSnapPoint) {
      if (!hasFitBodyMT()) {
        resolveFitSnapMT(getMainAxisLayoutSize(resolvedSide, e))
      }
      return
    }
    const bodySize = getMainAxisLayoutSize(resolvedSide, e)
    bodySizeMTRef.current = bodySize
    sheetSizeMTRef.current = isHorizontalSide(resolvedSide)
      ? bodySize
      : maxSnapSize
    if (contentSizeMTRef.current !== maxSnapSize) {
      updateContentSizeMT(maxSnapSize)
    }
  }

  function updateFooterHeightMT(height: number) {
    'main thread'
    if (!yRef.current) return
    const previousHeight = footerHeightMTRef.current
    footerHeightMTRef.current = height
    if (resolvedSide === 'bottom') updateSurfaceMT()
    else updateFooterPositionMT(yRef.current.get())
    if (hasFitSnapPoint && bodySizeMTRef.current >= 0) {
      resolveFitSnapMT(
        bodySizeMTRef.current,
        previousHeight > 0 && height === 0 && bodySizeMTRef.current === 0,
      )
      if (hasFitBodyMT()) updateSurfaceMT()
    }
  }

  function setFooterMTRef(element: MainThread.Element | null) {
    'main thread'
    if (!yRef.current) return
    if (footerMTRef.current !== element) footerOffsetMTRef.current = null
    footerMTRef.current = element
    if (element && footerHeightMTRef.current >= 0) {
      updateFooterHeightMT(footerHeightMTRef.current)
    }
  }

  return {
    footerContext: {
      resolvedSide,
      setFooterMTRef,
      updateFooterHeightMT,
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
