// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext, useContext } from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import type { GestureKind, StateManager } from '@lynx-js/gesture-runtime'
import { noop } from '@lynx-js/lynx-ui-common'
import type { PresenceState } from '@lynx-js/lynx-ui-presence'
import type { MotionValue } from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'

import type { InlineCornerStyles } from '../hooks/useSheetCornerStyle'
import type {
  SheetContentProps,
  SheetRootProps,
  SheetSide,
  SheetSnapPoint,
  SheetSurfaceHandle,
  SheetTransition,
  SheetViewportSize,
} from '../types'
import type { SheetResolvedSide } from '../utils'

export interface SheetMethods {
  snapTo: (
    index: number,
    opts?: {
      animate?: boolean
      snapAnimation?: SheetTransition
      isEntry?: boolean
    },
  ) => void
  expand: (
    opts?: { animate?: boolean, snapAnimation?: SheetTransition },
  ) => void
  collapse: (
    opts?: { animate?: boolean, snapAnimation?: SheetTransition },
  ) => void
  close: (
    opts?: { animate?: boolean, snapAnimation?: SheetTransition },
  ) => void
  show: (
    opts?: { animate?: boolean, snapAnimation?: SheetTransition },
  ) => void
}

export interface SheetContextValue {
  show: boolean
  autoOpen?: boolean
  forceMount: boolean
  mounted: boolean
  onUnmount: (closedEpoch?: number) => void
  isCurrentOpenEpoch?: (epoch?: number) => boolean
  openEpochMTRef?: MainThreadRef<number>
  setUncontrolledShow: (prop: boolean) => void
  onOpen?: () => void
  onClose?: () => void
  onShowChange?: (show: boolean) => void
  sheetProgress: MainThreadRef<MotionValue<number>>
  registerMethods: (methods: SheetMethods | null) => void
  // Physics
  snapPoints?: SheetSnapPoint[]
  initialSnap?: number
  onSnapChange?: (index: number, value: number) => void
  onSnapStartMT?: SheetRootProps['main-thread:onSnapStart']
  onDragStartMT?: SheetRootProps['main-thread:onDragStart']
  onPositionChangeMT?: SheetRootProps['main-thread:onPositionChange']
  onPresenceChangeMT?: SheetRootProps['main-thread:onPresenceChange']
  side: SheetSide
  enableRTL: boolean
  resolvedSide: SheetResolvedSide
  screenHeight?: number
  screenWidth?: number
  // Gesture
  rubberBand?: boolean | number | { coeff?: number, max?: number }
  dragDisabled?: boolean
  dismissThreshold?: number
  handleOnly?: boolean
  enableDragToClose?: boolean
  claimedGestureAngles?: [number, number][]
  presenceStateMTRef?: MainThreadRef<PresenceState>
  positionerSizeCacheRef?: {
    current: { hostKey: string, width: number, height: number } | null
  }
}

export interface SheetFooterContextValue {
  resolvedSide: SheetResolvedSide
  setFooterMTRef: (element: MainThread.Element | null) => void
  updateFooterHeightMT: (height: number) => void
}

export interface SheetPositionerDimensions {
  width?: number
  height?: number
  insetX?: number
  insetY?: number
}

export interface SheetLayoutRect {
  left: number
  top: number
  width: number
  height: number
}

export interface SheetSurfaceBodySubscriberMT {
  id: number
  onUpdate: () => void
  onSurfaceOriginLeft: (left: number, pendingWidth?: number) => void
  onParentLayout: () => void
  isFitBody: () => boolean
}

export interface SheetSurfaceBodyHubMT {
  nextId: number
  subscribers: SheetSurfaceBodySubscriberMT[]
  hasRange: boolean
  rangeStart: number
  rangeSize: number
  surfaceLeft: number
  surfaceTop: number
  horizontalOverride: { left: number, width: number } | null
  parentRect: Partial<SheetLayoutRect>
  settledBottom: number
  footerHeightMTRef?: MainThreadRef<number>
  onFitBodyLayout?: (height: number) => void
  requestSurfaceUpdate?: () => void
}

export interface SheetBodyContextValue {
  resolvedSide: SheetResolvedSide
  enableRTL: boolean
  viewportWidth: number
  viewportHeight: number
  maxSnapSize: number
  hasFitSnapPoint: boolean
  fitMinSize?: number
  fitMaxSize?: number
  initialBottomInset: number
  hubMTRef: MainThreadRef<SheetSurfaceBodyHubMT>
}

export interface InternalSheetSurfaceAppliedStyles {
  clipTransform: string
  surfaceHeight: string
  surfaceWidth: string
  surfaceTransform: string
  surfaceMask: string
  translation: string
  viewportHeight: string
}

export interface InternalSheetSurfaceStyleConfig {
  inlineCorners: InlineCornerStyles
  inlineCornerKey: string
  baseWidth: string
  baseTransform: string | null
  baseLeftPx: number
}

export interface InternalSheetSurfaceSeededSnapshot {
  width: string
  transform: string
  radii: [number | null, number | null, number | null, number | null]
}

export interface InternalSheetSurfaceHostMT {
  resolvedSide: SheetResolvedSide
  enableRTL: boolean
  hasFitSnapPoint: boolean
  maxSnapSize: number
  initialSnap: number
  initialSize: (index: number) => number
  position: MainThreadRef<MotionValue<number>>
  presence: MainThreadRef<PresenceState>
  sheetSizeMTRef: MainThreadRef<number>
  viewportSizeMTRef: MainThreadRef<SheetViewportSize>
  surfaceMTRef: MainThreadRef<MainThread.Element | null>
  movingSurfaceMTRef?: MainThreadRef<MainThread.Element | null>
  clipMTRef: MainThreadRef<MainThread.Element | null>
  viewportMTRef: MainThreadRef<MainThread.Element | null>
  appliedStylesMTRef: MainThreadRef<InternalSheetSurfaceAppliedStyles>
  footerHeightMTRef?: MainThreadRef<number>
  updateFooterPositionMT?: (visibleHeight: number) => void
  bodyHubMTRef: MainThreadRef<SheetSurfaceBodyHubMT>
  styleConfig?: InternalSheetSurfaceStyleConfig
  seededSurface?: InternalSheetSurfaceSeededSnapshot
  notifyBodyRangeMT: (start: number, size: number) => void
  hasFitBodyMT: () => boolean
  requestUpdateSurface: () => void
}

export interface InternalSheetSurfacePluginMT {
  onSurfaceAttach: (
    element: MainThread.Element | null,
    isNewNode: boolean,
    isFirstAttach: boolean,
    styleResetByReact: boolean,
  ) => void
  onClipAttach: (isNewNode: boolean) => void
  onViewportAttach: () => void
  onHostPropsSync: () => void
  onOpen: (entryTargetSize?: number) => void
  onEntryTarget: (entryTargetSize: number) => void
  onDrag: () => void
  onSettle: () => boolean
  updateVerticalSurface: (value: number, paintHeight: number) => void
}

export interface SheetSurfaceRenderSeed {
  horizontalBounds: { left: number, width: number } | null
  bottomInset: number
  cornerStyle: Record<string, string>
  seededSurface: InternalSheetSurfaceSeededSnapshot
}

export interface InternalSheetSurfaceHandle extends SheetSurfaceHandle {
  _internal: {
    pluginMTRef: MainThreadRef<InternalSheetSurfacePluginMT | null>
    getBaseBottomInset: () => number
    resolveHostConfig: (surfaceStyle?: SheetContentProps['style']) => {
      styleConfig: InternalSheetSurfaceStyleConfig
      styleSyncKey: string
    }
    resolveRenderSeed: (
      resolvedSide: SheetResolvedSide,
      screenWidth: number,
      enableRTL: boolean,
    ) => SheetSurfaceRenderSeed
    attachHostMT: (
      hostMTRef: MainThreadRef<InternalSheetSurfaceHostMT | null>,
      element: MainThread.Element | null,
    ) => void
  }
}

export function getInternalSheetSurface(
  surface: SheetSurfaceHandle | undefined,
): InternalSheetSurfaceHandle['_internal'] | undefined {
  return (surface as InternalSheetSurfaceHandle | undefined)?._internal
}

export const SheetBodyContext = createContext<SheetBodyContextValue | null>(
  null,
)

export const SheetPositionerContext = createContext<
  SheetPositionerDimensions | null
>(null)

export function useSheetPositionerContext() {
  return useContext(SheetPositionerContext)
}

export const SheetFooterContext = createContext<SheetFooterContextValue | null>(
  null,
)

export function useSheetFooterContext() {
  const context = useContext(SheetFooterContext)
  if (context?.resolvedSide !== 'bottom') {
    throw new Error(
      'SheetFooter requires bottom SheetContent or SheetNestedScrollContent',
    )
  }
  return context
}

export interface SheetDragContextValue {
  dragHandlers: {
    handleTouchStartMT?: (e: MainThread.TouchEvent) => void
    handleTouchMoveMT?: (e: MainThread.TouchEvent) => void
    handleTouchEndMT?: (e: MainThread.TouchEvent) => void
    gesture?: GestureKind
  }
}

export interface ActiveSheetScrollGesture {
  manager: StateManager | null
  consuming?: boolean
  revision?: number
  atStart?: boolean
  atEnd?: boolean
}

export interface SheetGestureContextValue {
  sheetGesture?: GestureKind
  scrollGesture?: GestureKind
  activeScrollMTRef?: MainThreadRef<ActiveSheetScrollGesture | null>
}

// @ts-expect-error MT initialize is useless
export const SheetContext = createContext<SheetContextValue>({
  show: false,
  forceMount: false,
  mounted: false,
  side: 'bottom',
  enableRTL: false,
  resolvedSide: 'bottom',
  onUnmount: noop,
  setUncontrolledShow: noop,
  registerMethods: noop,
})

export function useSheetContext() {
  const context = useContext(SheetContext)
  if (!context) {
    throw new Error(
      'SheetRoot should be placed at the root of the component tree',
    )
  }
  return context
}

// @ts-expect-error MT initialize is useless
export const SheetDragContext = createContext<SheetDragContextValue>({})

export function useSheetDragContext() {
  return useContext(SheetDragContext)
}

export const SheetGestureContext = createContext<SheetGestureContextValue>({})

export function useSheetGestureContext() {
  return useContext(SheetGestureContext)
}
