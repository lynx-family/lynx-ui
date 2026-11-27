// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnMainThread,
  useEffect,
  useMainThreadRef,
  useMemo,
  useRef,
} from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import type { PresenceState } from '@lynx-js/lynx-ui-presence'
import { createMotionValue } from '@lynx-js/motion/mini'
import type { MotionValue } from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'

import { getInternalSheetSurface } from '../context'
import type {
  InternalSheetSurfaceAppliedStyles,
  InternalSheetSurfaceHostMT,
  SheetBodyContextValue,
  SheetLayoutRect,
  SheetSurfaceBodyHubMT,
  SheetSurfaceRenderSeed,
} from '../context'
import type {
  SheetContentProps,
  SheetSurfaceHandle,
  SheetViewportSize,
} from '../types'
import type { SheetResolvedSide } from '../utils'

interface SheetSurfaceLayoutOptions {
  position: MainThreadRef<MotionValue<number>>
  presence: MainThreadRef<PresenceState>
  resolvedSide: SheetResolvedSide
  enableRTL: boolean
  surface?: SheetSurfaceHandle
  surfaceStyle?: SheetContentProps['style']
  screenHeight: number
  screenWidth: number
  allowOverDrag: boolean
  sheetSizeMTRef: MainThreadRef<number>
  movingSurfaceMTRef?: MainThreadRef<MainThread.Element | null>
  maxSnapSize: number
  hasFitSnapPoint: boolean
  fitMinSize?: number
  fitMaxSize?: number
  onFitBodyLayoutMT?: (height: number) => void
  footerHeightMTRef?: MainThreadRef<number>
  updateFooterPositionMT?: (visibleHeight: number) => void
  initialSize: (index: number) => number
  initialSnap: number
  surfaceLifecycleMTRef?: MainThreadRef<
    { open: () => void, settle: () => void } | null
  >
  onSurfaceReadyMT?: () => void
  onMotionValueChangeMT?: (value: number) => void
}

/**
 * Own core Sheet surface movement, paint coverage, and lightweight subscriber
 * slots for optional `useSheetSurface` and `SheetBody` plugins.
 */
export function useSheetSurfaceLayout({
  position,
  presence,
  resolvedSide,
  enableRTL,
  surface,
  surfaceStyle,
  screenHeight,
  screenWidth,
  allowOverDrag,
  sheetSizeMTRef,
  movingSurfaceMTRef,
  maxSnapSize,
  hasFitSnapPoint,
  fitMinSize,
  fitMaxSize,
  onFitBodyLayoutMT,
  footerHeightMTRef,
  updateFooterPositionMT,
  initialSize,
  initialSnap,
  surfaceLifecycleMTRef,
  onSurfaceReadyMT,
  onMotionValueChangeMT,
}: SheetSurfaceLayoutOptions) {
  const isBottom = resolvedSide === 'bottom'
  const horizontal = resolvedSide === 'left' || resolvedSide === 'right'
  const internalSurface = getInternalSheetSurface(surface)
  const hostStyleInfo = internalSurface?.resolveHostConfig(surfaceStyle)
  const hostStyleConfig = hostStyleInfo?.styleConfig
  const initialBottomInset = isBottom
    ? (internalSurface?.getBaseBottomInset() ?? 0)
    : 0
  const mountSeedRef = useRef<SheetSurfaceRenderSeed | null | undefined>(
    undefined,
  )
  if (mountSeedRef.current === undefined) {
    mountSeedRef.current = internalSurface
      ? internalSurface.resolveRenderSeed(resolvedSide, screenWidth, enableRTL)
      : null
  }
  const initialSeed = mountSeedRef.current ?? undefined
  const seededSurface = initialSeed?.seededSurface
  const initialViewportHeight = isBottom
    ? Math.min(maxSnapSize, Math.max(0, screenHeight - initialBottomInset))
    : maxSnapSize
  const pluginMTRef = internalSurface?.pluginMTRef
  const attachHostMT = internalSurface?.attachHostMT

  const clipMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const surfaceMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const viewportMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const lastClipNodeKeyMTRef = useMainThreadRef<unknown>(null)
  const lastMovingNodeKeyMTRef = useMainThreadRef<unknown>(null)
  const lastSurfaceNodeKeyMTRef = useMainThreadRef<unknown>(null)
  const lastSurfaceStyleKeyMTRef = useMainThreadRef<string | undefined>(
    undefined,
  )
  const unsubscribePositionMTRef = useMainThreadRef<(() => void) | null>(null)
  const viewportSizeMTRef = useMainThreadRef<SheetViewportSize>({
    width: screenWidth,
    height: screenHeight,
  })
  const surfaceStylesMTRef = useMainThreadRef<
    InternalSheetSurfaceAppliedStyles
  >({
    clipTransform: 'translateY(0px)',
    surfaceHeight: `${screenHeight * 1.5}px`,
    surfaceWidth: initialSeed?.horizontalBounds
      ? `${initialSeed.horizontalBounds.width}px`
      : '',
    surfaceTransform: initialSeed?.horizontalBounds
      ? `translateX(${initialSeed.horizontalBounds.left}px)`
      : '',
    surfaceMask: '',
    translation: '',
    viewportHeight: `${initialViewportHeight}px`,
  })
  const bodyHubMTRef = useMainThreadRef<SheetSurfaceBodyHubMT>({
    nextId: 0,
    subscribers: [],
    hasRange: false,
    rangeStart: 0,
    rangeSize: 0,
    surfaceLeft: 0,
    surfaceTop: 0,
    horizontalOverride: initialSeed?.horizontalBounds ?? null,
    parentRect: {},
    settledBottom: initialBottomInset,
    footerHeightMTRef,
  })
  const hostMTRef = useMainThreadRef<InternalSheetSurfaceHostMT | null>(null)
  const surfaceOpsMTRef = useMainThreadRef<
    {
      updateSurface: () => void
      settle: () => boolean
      bindPosition: (allowLazyInit?: boolean) => void
    } | null
  >(null)

  function getViewportSizeMT(): SheetViewportSize {
    'main thread'
    const size = viewportSizeMTRef.current
    return { width: size.width, height: size.height }
  }

  function hasFitBodyMT() {
    'main thread'
    if (!hasFitSnapPoint) return false
    const subs = bodyHubMTRef.current.subscribers
    for (const sub of subs) {
      if (sub.isFitBody()) return true
    }
    return false
  }

  function notifyBodyRangeMT(start: number, size: number) {
    'main thread'
    const hub = bodyHubMTRef.current
    hub.hasRange = true
    hub.rangeStart = start
    hub.rangeSize = size
    const subs = hub.subscribers
    for (const sub of subs) {
      sub.onUpdate()
    }
  }

  function requestUpdateSurfaceMT() {
    'main thread'
    surfaceOpsMTRef.current?.updateSurface()
  }

  function syncHostRefMT() {
    'main thread'
    const hub = bodyHubMTRef.current
    hub.footerHeightMTRef = footerHeightMTRef
    hub.onFitBodyLayout = onFitBodyLayoutMT
    hub.requestSurfaceUpdate = requestUpdateSurfaceMT
    hostMTRef.current = {
      resolvedSide,
      enableRTL,
      hasFitSnapPoint,
      maxSnapSize,
      initialSnap,
      initialSize,
      position,
      presence,
      sheetSizeMTRef,
      viewportSizeMTRef,
      surfaceMTRef,
      movingSurfaceMTRef,
      clipMTRef,
      viewportMTRef,
      appliedStylesMTRef: surfaceStylesMTRef,
      footerHeightMTRef,
      updateFooterPositionMT,
      bodyHubMTRef,
      styleConfig: hostStyleConfig,
      seededSurface,
      notifyBodyRangeMT,
      hasFitBodyMT,
      requestUpdateSurface: requestUpdateSurfaceMT,
    }
  }

  function updateSurfaceMT() {
    'main thread'
    const motion = position.current
    if (!motion) return
    const value = Math.max(0, motion.get())
    const currentScreenWidth = viewportSizeMTRef.current.width
    const currentScreenHeight = viewportSizeMTRef.current.height
    if (horizontal) {
      const opened = Math.max(sheetSizeMTRef.current, maxSnapSize)
      const extent = allowOverDrag ? value : Math.min(value, opened)
      const panelSize = hasFitSnapPoint && hasFitBodyMT()
        ? Math.max(sheetSizeMTRef.current, maxSnapSize)
        : maxSnapSize
      notifyBodyRangeMT(
        resolvedSide === 'right'
          ? currentScreenWidth - extent
          : extent - panelSize,
        panelSize,
      )
      return
    }

    const paintHeight = Math.max(
      currentScreenHeight * 1.5,
      maxSnapSize,
      sheetSizeMTRef.current,
    )
    const plugin = pluginMTRef?.current
    if (plugin) {
      plugin.updateVerticalSurface(value, paintHeight)
      return
    }

    // Default attached vertical path (zero frame/corner/clip-mask engine overhead).
    if (isBottom) updateFooterPositionMT?.(value)
    const applied = surfaceStylesMTRef.current
    const translateY = resolvedSide === 'top' ? motion.get() : -motion.get()
    const translation = `translate(0px, ${translateY}px)`
    const movingSurface = movingSurfaceMTRef?.current
    if (movingSurface && applied.translation !== translation) {
      applied.translation = translation
      movingSurface.setStyleProperties({ transform: translation })
    }

    const surfaceEl = surfaceMTRef.current
    const surfaceHeight = `${paintHeight}px`
    if (surfaceEl && applied.surfaceHeight !== surfaceHeight) {
      applied.surfaceHeight = surfaceHeight
      surfaceEl.setStyleProperties({ height: surfaceHeight })
    }

    if (!hasFitSnapPoint) {
      const viewport = viewportMTRef.current
      const viewportHeight = `${maxSnapSize}px`
      if (viewport && applied.viewportHeight !== viewportHeight) {
        applied.viewportHeight = viewportHeight
        viewport.setStyleProperties({ height: viewportHeight })
      }
      notifyBodyRangeMT(
        isBottom ? currentScreenHeight - value : value - maxSnapSize,
        isBottom ? value : maxSnapSize,
      )
    } else if (hasFitBodyMT()) {
      if (isBottom) {
        notifyBodyRangeMT(
          currentScreenHeight - value,
          Math.max(
            0,
            value - Math.max(0, footerHeightMTRef?.current ?? 0),
          ),
        )
      } else {
        const contentHeight = Math.max(sheetSizeMTRef.current, 0)
        notifyBodyRangeMT(value - contentHeight, contentHeight)
      }
    }
  }

  function settleSurfaceMT() {
    'main thread'
    return pluginMTRef?.current?.onSettle() ?? false
  }

  function handleMotionChangeMT(value: number) {
    'main thread'
    onMotionValueChangeMT?.(value)
    updateSurfaceMT()
  }

  function bindPositionListenerMT(allowLazyInit = false) {
    'main thread'
    unsubscribePositionMTRef.current?.()
    unsubscribePositionMTRef.current = null
    if (!position.current && allowLazyInit) {
      position.current = createMotionValue(0)
    }
    if (position.current) {
      unsubscribePositionMTRef.current = position.current.on(
        'change',
        handleMotionChangeMT,
      )
    }
  }

  function maybeUnbindPositionListenerMT() {
    'main thread'
    if (
      surfaceMTRef.current === null
      && !movingSurfaceMTRef?.current
      && clipMTRef.current === null
    ) {
      unsubscribePositionMTRef.current?.()
      unsubscribePositionMTRef.current = null
    }
  }

  function openSurfaceMT() {
    'main thread'
    const ops = surfaceOpsMTRef.current
    ops?.bindPosition(true)
    pluginMTRef?.current?.onOpen()
    ops?.updateSurface()
  }

  function registerSurfaceLifecycleMT() {
    'main thread'
    if (surfaceLifecycleMTRef) {
      surfaceLifecycleMTRef.current = {
        open: openSurfaceMT,
        settle: settleSurfaceMT,
      }
    }
  }

  function syncHostMT() {
    'main thread'
    surfaceOpsMTRef.current = {
      updateSurface: updateSurfaceMT,
      settle: settleSurfaceMT,
      bindPosition: bindPositionListenerMT,
    }
    viewportSizeMTRef.current = { width: screenWidth, height: screenHeight }
    syncHostRefMT()
    bindPositionListenerMT()
    pluginMTRef?.current?.onHostPropsSync()
    updateSurfaceMT()
  }

  const hostSyncKey = `${screenHeight}|${screenWidth}|${maxSnapSize}|${
    String(hasFitSnapPoint)
  }|${fitMinSize ?? ''}|${fitMaxSize ?? ''}|${resolvedSide}|${
    String(enableRTL)
  }|${hostStyleInfo?.styleSyncKey ?? ''}`
  const lastHostSyncKeyRef = useRef(hostSyncKey)

  useEffect(() => {
    if (lastHostSyncKeyRef.current === hostSyncKey) {
      return
    }
    lastHostSyncKeyRef.current = hostSyncKey
    runOnMainThread(registerSurfaceLifecycleMT)()
    runOnMainThread(syncHostMT)()
  }, [hostSyncKey])

  function getNativeNodeKeyMT(element: MainThread.Element): unknown {
    'main thread'
    return (element as unknown as { element?: unknown }).element ?? element
  }

  function measureSurfaceMT(event: MainThread.LayoutChangeEvent) {
    'main thread'
    const { left, top } = event.detail ?? event.params
    const hub = bodyHubMTRef.current
    if (hub.surfaceLeft === left && hub.surfaceTop === top) return
    hub.surfaceLeft = left
    hub.surfaceTop = top
    for (const sub of hub.subscribers) {
      sub.onUpdate()
    }
  }

  function measureBodyParentMT(rect?: Partial<SheetLayoutRect>) {
    'main thread'
    if (!rect) return
    const hub = bodyHubMTRef.current
    const parent = hub.parentRect
    const nextLeft = rect.left ?? parent.left
    const nextTop = rect.top ?? parent.top
    const nextWidth = rect.width ?? parent.width
    const nextHeight = rect.height ?? parent.height
    if (
      parent.left === nextLeft
      && parent.top === nextTop
      && parent.width === nextWidth
      && parent.height === nextHeight
    ) {
      return
    }
    parent.left = nextLeft
    parent.top = nextTop
    parent.width = nextWidth
    parent.height = nextHeight
    for (const sub of hub.subscribers) {
      sub.onParentLayout()
    }
  }

  function setSurfaceMTRef(
    element: MainThread.Element | null,
    renderedStyleKey?: string,
  ) {
    'main thread'
    surfaceMTRef.current = element
    if (!element) {
      pluginMTRef?.current?.onSurfaceAttach(null, false, false, false)
      maybeUnbindPositionListenerMT()
      return
    }
    surfaceOpsMTRef.current = {
      updateSurface: updateSurfaceMT,
      settle: settleSurfaceMT,
      bindPosition: bindPositionListenerMT,
    }
    syncHostRefMT()
    attachHostMT?.(hostMTRef, element)
    const nodeKey = getNativeNodeKeyMT(element)
    const isNewNode = nodeKey !== lastSurfaceNodeKeyMTRef.current
    const isFirstAttach = lastSurfaceNodeKeyMTRef.current === null
    const styleResetByReact = !isNewNode
      && renderedStyleKey !== undefined
      && lastSurfaceStyleKeyMTRef.current !== undefined
      && renderedStyleKey !== lastSurfaceStyleKeyMTRef.current
    lastSurfaceNodeKeyMTRef.current = nodeKey
    if (renderedStyleKey !== undefined) {
      lastSurfaceStyleKeyMTRef.current = renderedStyleKey
    }
    if (isNewNode || styleResetByReact) {
      surfaceStylesMTRef.current.surfaceHeight = `${
        viewportSizeMTRef.current.height * 1.5
      }px`
      surfaceStylesMTRef.current.surfaceMask = ''
    }
    bindPositionListenerMT()
    registerSurfaceLifecycleMT()
    pluginMTRef?.current?.onSurfaceAttach(
      element,
      isNewNode,
      isFirstAttach,
      styleResetByReact,
    )
    updateSurfaceMT()
    if (!horizontal && movingSurfaceMTRef?.current) {
      onSurfaceReadyMT?.()
    }
  }

  function setSheetMTRef(element: MainThread.Element | null) {
    'main thread'
    if (!movingSurfaceMTRef) return
    movingSurfaceMTRef.current = element
    if (horizontal) {
      surfaceMTRef.current = element
    }
    if (!element) {
      if (horizontal) {
        pluginMTRef?.current?.onSurfaceAttach(null, false, false, false)
      }
      maybeUnbindPositionListenerMT()
      return
    }
    surfaceOpsMTRef.current = {
      updateSurface: updateSurfaceMT,
      settle: settleSurfaceMT,
      bindPosition: bindPositionListenerMT,
    }
    syncHostRefMT()
    if (horizontal) {
      attachHostMT?.(hostMTRef, element)
    }
    bindPositionListenerMT(true)
    registerSurfaceLifecycleMT()
    const nodeKey = getNativeNodeKeyMT(element)
    const isNewNode = nodeKey !== lastMovingNodeKeyMTRef.current
    const isFirstAttach = lastMovingNodeKeyMTRef.current === null
    lastMovingNodeKeyMTRef.current = nodeKey
    if (horizontal) {
      pluginMTRef?.current?.onSurfaceAttach(
        element,
        isNewNode,
        isFirstAttach,
        false,
      )
    }
    if (isNewNode) {
      surfaceStylesMTRef.current.translation = ''
    }
    updateSurfaceMT()
    if (horizontal || surfaceMTRef.current) {
      onSurfaceReadyMT?.()
    }
  }

  function setViewportMTRef(element: MainThread.Element) {
    'main thread'
    if (viewportMTRef.current !== element) {
      viewportMTRef.current = element
      syncHostRefMT()
      const initHeight = isBottom
        ? Math.min(
          maxSnapSize,
          Math.max(
            0,
            viewportSizeMTRef.current.height
              - bodyHubMTRef.current.settledBottom,
          ),
        )
        : maxSnapSize
      surfaceStylesMTRef.current.viewportHeight = `${initHeight}px`
    }
    surfaceOpsMTRef.current?.updateSurface()
  }

  function setClipMTRef(element: MainThread.Element | null) {
    'main thread'
    clipMTRef.current = element
    if (!element) {
      maybeUnbindPositionListenerMT()
      return
    }
    syncHostRefMT()
    const nodeKey = getNativeNodeKeyMT(element)
    if (nodeKey !== lastClipNodeKeyMTRef.current) {
      lastClipNodeKeyMTRef.current = nodeKey
      surfaceStylesMTRef.current.clipTransform = 'translateY(0px)'
    }
    surfaceOpsMTRef.current?.bindPosition()
    surfaceOpsMTRef.current?.updateSurface()
  }

  function isSurfaceReadyMT() {
    'main thread'
    if (horizontal) {
      return Boolean(movingSurfaceMTRef?.current)
    }
    return Boolean(surfaceMTRef.current && movingSurfaceMTRef?.current)
  }

  const bodyContext = useMemo<SheetBodyContextValue>(
    () => ({
      resolvedSide,
      enableRTL,
      viewportWidth: screenWidth,
      viewportHeight: screenHeight,
      maxSnapSize,
      hasFitSnapPoint,
      fitMinSize,
      fitMaxSize,
      initialBottomInset,
      hubMTRef: bodyHubMTRef,
    }),
    [
      resolvedSide,
      enableRTL,
      screenWidth,
      screenHeight,
      maxSnapSize,
      hasFitSnapPoint,
      fitMinSize,
      fitMaxSize,
      initialBottomInset,
      bodyHubMTRef,
    ],
  )

  return {
    setSheetMTRef,
    setClipMTRef,
    setSurfaceMTRef,
    setViewportMTRef,
    isSurfaceReadyMT,
    settleSurfaceMT,
    openSurfaceMT,
    getViewportSizeMT,
    measureBodyParentMT,
    measureSurfaceMT,
    hasFitBodyMT,
    updateSurfaceMT,
    bodyHubMTRef,
    bodyContext,
  }
}
