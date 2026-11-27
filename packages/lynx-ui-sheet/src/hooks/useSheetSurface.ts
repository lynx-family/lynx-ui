// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnMainThread,
  useEffect,
  useMainThreadRef,
  useRef,
} from '@lynx-js/react'
import type { MainThreadRef } from '@lynx-js/react'

import { PresenceState } from '@lynx-js/lynx-ui-presence'
import type { MainThread } from '@lynx-js/types'

import type {
  InternalSheetSurfaceHandle,
  InternalSheetSurfaceHostMT,
  InternalSheetSurfacePluginMT,
  InternalSheetSurfaceStyleConfig,
  SheetSurfaceRenderSeed,
} from '../context'
import type {
  SheetContentProps,
  SheetCornerRadius,
  SheetSurfaceAlign,
  SheetSurfaceController,
  SheetSurfaceFrame,
  SheetSurfaceHandle,
  SheetSurfaceOptions,
  SheetViewportSize,
} from '../types'
import { setElementStylesMT } from '../utils'
import type { SheetResolvedSide } from '../utils'
import {
  applySurfaceCornersMT,
  extractInlineCornerStyles,
  normalizeCornerRadii,
  normalizeCornerRadiiMT,
} from './useSheetCornerStyle'
import type { CornerRadii } from './useSheetCornerStyle'
import {
  equalSurfaceSizeMT,
  normalizeInset,
  normalizeInsetMT,
  parseSurfaceSize,
  parseSurfaceSizeMT,
  resolveHorizontalBoundsMT,
  resolveSurfaceHorizontalFrame,
} from '../utils/surfaceFrame'
import type { ParsedSurfaceSize } from '../utils/surfaceFrame'

interface BaseSurfaceGeometry {
  key: string
  frameKey: string
  radiusKey: string
  right: number
  bottom: number
  left: number
  width: ParsedSurfaceSize | null
  maxWidth: ParsedSurfaceSize | null
  align: SheetSurfaceAlign
  hasHorizontalSpec: boolean
  radii: CornerRadii
}

const DEFAULT_STYLE_CONFIG: InternalSheetSurfaceStyleConfig = {
  inlineCorners: {
    borderRadius: undefined,
    corners: [undefined, undefined, undefined, undefined],
  },
  inlineCornerKey: '||||',
  baseWidth: '100%',
  baseTransform: null,
  baseLeftPx: 0,
}

function parseHostStyleConfig(
  surfaceStyle?: SheetContentProps['style'],
): InternalSheetSurfaceStyleConfig {
  const inlineCorners = extractInlineCornerStyles(surfaceStyle)
  const [tl, tr, br, bl] = inlineCorners.corners
  const inlineCornerKey = `${inlineCorners.borderRadius ?? ''}|${tl ?? ''}|${
    tr ?? ''
  }|${br ?? ''}|${bl ?? ''}`
  const baseWidth = typeof surfaceStyle?.width === 'number'
    ? `${surfaceStyle.width}px`
    : surfaceStyle?.width ?? '100%'
  const baseTransform = surfaceStyle?.transform ?? null
  const baseLeftPx = typeof surfaceStyle?.left === 'number'
      && Number.isFinite(surfaceStyle.left)
    ? surfaceStyle.left
    : 0
  return {
    inlineCorners,
    inlineCornerKey,
    baseWidth,
    baseTransform,
    baseLeftPx,
  }
}

/**
 * Create an opt-in surface handle for floating constraint frames, dynamic
 * corner radii, and main-thread `SheetSurfaceController` updates.
 * When `useSheetSurface` is not imported, its frame and corner engines are
 * completely tree-shaken from `SheetContent` and `SheetNestedScrollContent`.
 */
export function useSheetSurface(
  options?: SheetSurfaceOptions,
): SheetSurfaceHandle {
  const frame = options?.frame
  const cornerRadius = options?.cornerRadius
  const controllerRef = useMainThreadRef<SheetSurfaceController | null>(null)
  const pluginMTRef = useMainThreadRef<InternalSheetSurfacePluginMT | null>(
    null,
  )
  const hostRefMTRef = useMainThreadRef<
    MainThreadRef<InternalSheetSurfaceHostMT | null> | null
  >(null)

  const propRight = normalizeInset(frame?.insets?.right)
  const propBottom = normalizeInset(frame?.insets?.bottom)
  const propLeft = normalizeInset(frame?.insets?.left)
  const propWidth = parseSurfaceSize(frame?.width)
  const propMaxWidth = parseSurfaceSize(frame?.maxWidth)
  const propAlign: SheetSurfaceAlign = frame?.align ?? 'center'
  const propHasHorizontalSpec = frame?.insets?.left !== undefined
    || frame?.insets?.right !== undefined
    || propWidth !== null
    || propMaxWidth !== null
  const propRadii = normalizeCornerRadii(cornerRadius)
  const [propTL, propTR, propBR, propBL] = propRadii
  const frameSyncKey = `${propRight}|${propBottom}|${propLeft}|${
    propWidth?.kind ?? ''
  }:${propWidth?.value ?? ''}|${propMaxWidth?.kind ?? ''}:${
    propMaxWidth?.value ?? ''
  }|${propAlign}|${String(propHasHorizontalSpec)}`
  const radiusSyncKey = `${propTL ?? ''},${propTR ?? ''},${propBR ?? ''},${
    propBL ?? ''
  }`
  const baseSyncKey = `${frameSyncKey}|${radiusSyncKey}`

  const appliedRadiiMTRef = useMainThreadRef<CornerRadii | null>(propRadii)
  const appliedInlineCornerKeyMTRef = useMainThreadRef('')
  const panelHeightMTRef = useMainThreadRef(0)
  const baseGeometryMTRef = useMainThreadRef<BaseSurfaceGeometry>({
    key: baseSyncKey,
    frameKey: frameSyncKey,
    radiusKey: radiusSyncKey,
    right: propRight,
    bottom: propBottom,
    left: propLeft,
    width: propWidth,
    maxWidth: propMaxWidth,
    align: propAlign,
    hasHorizontalSpec: propHasHorizontalSpec,
    radii: propRadii,
  })
  const geometryMTRef = useMainThreadRef({
    right: propRight,
    bottom: propBottom,
    left: propLeft,
    width: propWidth,
    maxWidth: propMaxWidth,
    align: propAlign,
    hasHorizontal: propHasHorizontalSpec,
    radii: propRadii,
    hasFrameOverride: false,
    hasRadiusOverride: false,
    settledBottom: propBottom,
    bottomUpdatePending: false,
    animatingToken: 0,
    settleCheckScheduled: false,
  })
  const scheduleAutoSettleMTRef = useMainThreadRef<(() => void) | null>(null)
  const internalOpsMTRef = useMainThreadRef<
    {
      applyHorizontal: () => void
      updateCorners: (reapply?: boolean) => void
      settle: () => boolean
    } | null
  >(null)

  function getHostMT(): InternalSheetSurfaceHostMT | null {
    'main thread'
    return hostRefMTRef.current?.current ?? null
  }

  function notifySubscribersLeftMT(left: number, pendingWidth?: number) {
    'main thread'
    const host = hostRefMTRef.current?.current
    if (!host) return
    const subs = host.bodyHubMTRef.current.subscribers
    for (const sub of subs) {
      sub.onSurfaceOriginLeft(left, pendingWidth)
    }
  }

  function applyHorizontalFrameMT() {
    'main thread'
    const host = hostRefMTRef.current?.current
    if (!host) return
    const horizontal = host.resolvedSide === 'left'
      || host.resolvedSide === 'right'
    if (horizontal) return
    const geo = geometryMTRef.current
    const surface = host.surfaceMTRef.current
    const applied = host.appliedStylesMTRef.current
    const hub = host.bodyHubMTRef.current
    const styleCfg = host.styleConfig ?? DEFAULT_STYLE_CONFIG
    const currentScreenWidth = host.viewportSizeMTRef.current.width
    if (!geo.hasHorizontal) {
      const hadHorizontalOverride = hub.horizontalOverride !== null
        || applied.surfaceWidth !== ''
        || applied.surfaceTransform !== ''
      hub.horizontalOverride = null
      if (hadHorizontalOverride) {
        hub.surfaceLeft = styleCfg.baseLeftPx
        const pendingWidth =
          styleCfg.baseWidth === '100%' && styleCfg.baseLeftPx === 0
            ? currentScreenWidth
            : undefined
        notifySubscribersLeftMT(styleCfg.baseLeftPx, pendingWidth)
      }
      if (
        surface
        && (applied.surfaceWidth !== '' || applied.surfaceTransform !== '')
      ) {
        applied.surfaceWidth = ''
        applied.surfaceTransform = ''
        setElementStylesMT(surface, {
          width: styleCfg.baseWidth,
          transform: styleCfg.baseTransform,
        })
      }
      return
    }
    const { left, width } = resolveHorizontalBoundsMT(
      geo.left,
      geo.right,
      geo.width,
      geo.maxWidth,
      geo.align,
      currentScreenWidth,
      host.enableRTL,
    )
    hub.horizontalOverride = { left, width }
    hub.surfaceLeft = left
    notifySubscribersLeftMT(left)
    const transformStyle = `translateX(${left}px)`
    const widthStyle = `${width}px`
    if (
      surface
      && (applied.surfaceTransform !== transformStyle
        || applied.surfaceWidth !== widthStyle)
    ) {
      const styles: Record<string, string> = {}
      if (applied.surfaceTransform !== transformStyle) {
        applied.surfaceTransform = transformStyle
        styles.transform = transformStyle
      }
      if (applied.surfaceWidth !== widthStyle) {
        applied.surfaceWidth = widthStyle
        styles.width = widthStyle
      }
      surface.setStyleProperties(styles)
    }
  }

  function updateCornersMT(reapply = false) {
    'main thread'
    const host = hostRefMTRef.current?.current
    if (!host) return
    const styleCfg = host.styleConfig ?? DEFAULT_STYLE_CONFIG
    appliedRadiiMTRef.current = applySurfaceCornersMT(
      host.surfaceMTRef.current,
      geometryMTRef.current.radii,
      appliedRadiiMTRef.current,
      styleCfg.inlineCorners,
      reapply,
      host.resolvedSide === 'bottom',
    )
  }

  function settleSurfaceMT() {
    'main thread'
    const host = hostRefMTRef.current?.current
    if (
      host?.resolvedSide !== 'bottom'
      || geometryMTRef.current.bottomUpdatePending
    ) {
      return false
    }
    const geo = geometryMTRef.current
    const nextSettled = host.presence.current === PresenceState.Entered
      ? geo.bottom
      : 0
    const changed = geo.settledBottom !== nextSettled
    geo.settledBottom = nextSettled
    host.bodyHubMTRef.current.settledBottom = nextSettled
    if (changed) host.requestUpdateSurface()
    return changed
  }

  function scheduleAutoSettleMT() {
    'main thread'
    scheduleAutoSettleMTRef.current = scheduleAutoSettleMT
    const geo = geometryMTRef.current
    if (
      geo.settleCheckScheduled || typeof requestAnimationFrame !== 'function'
    ) {
      return
    }
    const token = geo.animatingToken
    geo.settleCheckScheduled = true
    requestAnimationFrame(() => {
      'main thread'
      requestAnimationFrame(() => {
        'main thread'
        const current = geometryMTRef.current
        current.settleCheckScheduled = false
        if (!current.bottomUpdatePending) return
        if (current.animatingToken !== token) {
          scheduleAutoSettleMTRef.current?.()
          return
        }
        current.bottomUpdatePending = false
        const host = hostRefMTRef.current?.current
        if (!host?.position.current?.isAnimating()) {
          internalOpsMTRef.current?.settle()
        }
      })
    })
  }

  function setFrameMT(
    nextFrame: SheetSurfaceFrame,
    frameOptions?: { animating?: boolean },
  ) {
    'main thread'
    const host = hostRefMTRef.current?.current
    const ops = internalOpsMTRef.current
    const geo = geometryMTRef.current
    geo.hasFrameOverride = true
    const horizontal = host?.resolvedSide === 'left'
      || host?.resolvedSide === 'right'
    const isBottom = !host || host.resolvedSide === 'bottom'
    const nextInsets = nextFrame.insets
    const nextRight = normalizeInsetMT(nextInsets?.right)
    const nextBottom = normalizeInsetMT(nextInsets?.bottom)
    const nextLeft = normalizeInsetMT(nextInsets?.left)
    const nextWidth = parseSurfaceSizeMT(nextFrame.width)
    const nextMaxWidth = parseSurfaceSizeMT(nextFrame.maxWidth)
    const nextAlign: SheetSurfaceAlign = nextFrame.align ?? 'center'
    const nextHasHorizontal = !horizontal
      && (nextInsets?.left !== undefined
        || nextInsets?.right !== undefined
        || nextWidth !== null
        || nextMaxWidth !== null)
    const changed = geo.right !== nextRight
      || geo.bottom !== nextBottom
      || geo.left !== nextLeft
      || !equalSurfaceSizeMT(geo.width, nextWidth)
      || !equalSurfaceSizeMT(geo.maxWidth, nextMaxWidth)
      || geo.align !== nextAlign
      || geo.hasHorizontal !== nextHasHorizontal
    const animating = frameOptions?.animating === true
    const bottomChanged = geo.bottom !== nextBottom
    if (changed) {
      geo.right = nextRight
      geo.bottom = nextBottom
      geo.left = nextLeft
      geo.width = nextWidth
      geo.maxWidth = nextMaxWidth
      geo.align = nextAlign
      geo.hasHorizontal = nextHasHorizontal
      ops?.applyHorizontal()
    }
    let settled = false
    if (isBottom) {
      if (animating) {
        if (bottomChanged) {
          geo.bottomUpdatePending = true
        }
        if (changed && geo.bottomUpdatePending) {
          geo.animatingToken += 1
          scheduleAutoSettleMT()
        }
      } else {
        const hadPending = geo.bottomUpdatePending
        geo.bottomUpdatePending = false
        geo.animatingToken += 1
        if (
          !host?.position.current?.isAnimating()
          && (hadPending || bottomChanged
            || (host?.presence.current === PresenceState.Entered
              && geo.settledBottom !== nextBottom))
        ) {
          settled = ops?.settle() ?? false
        }
      }
    }
    if (changed && !settled) {
      host?.requestUpdateSurface()
    }
  }

  function setCornerRadiusMT(nextRadius: SheetCornerRadius | undefined) {
    'main thread'
    const host = hostRefMTRef.current?.current
    const ops = internalOpsMTRef.current
    const previousRadii = geometryMTRef.current.radii
    const radii = normalizeCornerRadiiMT(nextRadius)
    geometryMTRef.current.hasRadiusOverride = true
    geometryMTRef.current.radii = radii
    ops?.updateCorners()
    if (
      (!host || host.resolvedSide === 'bottom')
      && (previousRadii[2] !== radii[2] || previousRadii[3] !== radii[3])
    ) {
      host?.requestUpdateSurface()
    }
  }

  function getViewportSizeMT(): SheetViewportSize {
    'main thread'
    const size = hostRefMTRef.current?.current?.viewportSizeMTRef.current
    return { width: size?.width ?? 0, height: size?.height ?? 0 }
  }

  function updateVerticalSurfaceMT(value: number, paintHeight: number) {
    'main thread'
    const host = hostRefMTRef.current?.current
    if (!host) return
    const isBottom = host.resolvedSide === 'bottom'
    const screenHeight = host.viewportSizeMTRef.current.height
    const geo = geometryMTRef.current
    const state = host.presence.current
    const entering = state === PresenceState.Entering
    const leaving = state === PresenceState.Leaving
      || state === PresenceState.Left
    const hasRoundedBottom = isBottom
      && ((geo.radii[2] ?? 0) > 0 || (geo.radii[3] ?? 0) > 0)
    const height = entering
      ? (hasRoundedBottom
        ? Math.max(host.initialSize(host.initialSnap), 0)
        : Math.max(value, host.initialSize(host.initialSnap), 0))
      : (leaving ? Math.max(panelHeightMTRef.current, value) : value)
    panelHeightMTRef.current = height

    const visibleFraction = entering || leaving
      ? (height > 0 ? Math.min(1, value / height) : 0)
      : 1
    const effectiveBottom = isBottom ? geo.bottom * visibleFraction : 0
    const hasBottomBound = isBottom
      && (geo.bottom > 0 || (geo.radii[2] ?? 0) > 0
        || (geo.radii[3] ?? 0) > 0)
    const surfaceTop = screenHeight - value - effectiveBottom
    const correction = hasBottomBound
      ? Math.min(height, Math.max(0, -surfaceTop))
      : 0
    const visibleHeight = height - correction
    if (isBottom) host.updateFooterPositionMT?.(value - correction)

    const visualTop = surfaceTop + correction
    const clipOffset = isBottom && effectiveBottom > 0
      ? Math.max(0, screenHeight - (visualTop + visibleHeight))
      : 0
    const applied = host.appliedStylesMTRef.current
    const clipTransform = `translateY(${-clipOffset}px)`
    const clip = host.clipMTRef.current
    if (clip && applied.clipTransform !== clipTransform) {
      applied.clipTransform = clipTransform
      clip.setStyleProperties({ transform: clipTransform })
    }

    const rawMotion = host.position.current.get()
    const translateY = host.resolvedSide === 'top'
      ? rawMotion
      : -rawMotion - (effectiveBottom - clipOffset) + correction
    const translation = `translate(0px, ${translateY}px)`
    const movingSurface = host.movingSurfaceMTRef?.current
    if (movingSurface && applied.translation !== translation) {
      applied.translation = translation
      movingSurface.setStyleProperties({ transform: translation })
    }

    const surface = host.surfaceMTRef.current
    const surfaceHeight = `${paintHeight}px`
    const bottomRight = Math.min(geo.radii[2] ?? 0, visibleHeight / 2)
    const bottomLeft = Math.min(geo.radii[3] ?? 0, visibleHeight / 2)
    const needsRoundedBottomClip = isBottom
      && (bottomRight > 0 || bottomLeft > 0)
    const clippedBottom = needsRoundedBottomClip
      ? Math.max(0, paintHeight - visibleHeight)
      : 0
    const mask = needsRoundedBottomClip
      ? `inset(0px 0px ${clippedBottom}px 0px round 0px 0px ${bottomRight}px ${bottomLeft}px)`
      : ''
    const heightChanged = applied.surfaceHeight !== surfaceHeight
    const maskChanged = applied.surfaceMask !== mask
    if (surface && (heightChanged || maskChanged)) {
      applied.surfaceHeight = surfaceHeight
      applied.surfaceMask = mask
      surface.setStyleProperties({
        ...(heightChanged ? { height: surfaceHeight } : {}),
        ...(maskChanged ? { 'clip-path': mask || 'none' } : {}),
      })
    }

    if (!host.hasFitSnapPoint) {
      const contentHeight = isBottom
        ? Math.min(
          host.maxSnapSize,
          Math.max(0, screenHeight - geo.settledBottom),
        )
        : host.maxSnapSize
      const viewport = host.viewportMTRef.current
      const viewportHeight = `${contentHeight}px`
      if (viewport && applied.viewportHeight !== viewportHeight) {
        applied.viewportHeight = viewportHeight
        viewport.setStyleProperties({ height: viewportHeight })
      }
      host.notifyBodyRangeMT(
        isBottom ? visualTop : value - contentHeight,
        isBottom ? visibleHeight : contentHeight,
      )
    } else if (host.hasFitBodyMT()) {
      if (isBottom) {
        host.notifyBodyRangeMT(
          visualTop,
          Math.max(
            0,
            visibleHeight - Math.max(0, host.footerHeightMTRef?.current ?? 0),
          ),
        )
      } else {
        const contentHeight = Math.max(host.sheetSizeMTRef.current, 0)
        host.notifyBodyRangeMT(value - contentHeight, contentHeight)
      }
    }
  }

  function applyBaseToLiveMT(
    base: BaseSurfaceGeometry,
    prevBase: BaseSurfaceGeometry,
  ) {
    'main thread'
    const host = getHostMT()
    const horizontal = host?.resolvedSide === 'left'
      || host?.resolvedSide === 'right'
    const isBottom = !host || host.resolvedSide === 'bottom'
    const geo = geometryMTRef.current
    if (base.frameKey !== prevBase.frameKey && !geo.hasFrameOverride) {
      geo.right = base.right
      geo.bottom = base.bottom
      geo.left = base.left
      geo.width = base.width
      geo.maxWidth = base.maxWidth
      geo.align = base.align
      geo.hasHorizontal = !horizontal && base.hasHorizontalSpec
      geo.bottomUpdatePending = false
      geo.animatingToken += 1
      if (isBottom && !host?.position.current?.isAnimating()) {
        geo.settledBottom = base.bottom
        if (host) {
          host.bodyHubMTRef.current.settledBottom = base.bottom
        }
      }
    }
    if (base.radiusKey !== prevBase.radiusKey && !geo.hasRadiusOverride) {
      geo.radii = [
        base.radii[0],
        base.radii[1],
        base.radii[2],
        base.radii[3],
      ]
    }
  }

  function onSurfaceAttachMT(
    element: MainThread.Element | null,
    isNewNode: boolean,
    isFirstAttach: boolean,
    styleResetByReact: boolean,
  ) {
    'main thread'
    if (!element) {
      controllerRef.current = null
      return
    }
    const host = getHostMT()
    const applied = host?.appliedStylesMTRef.current
    if (isNewNode) {
      if (!isFirstAttach) {
        appliedRadiiMTRef.current = null
        if (applied) {
          applied.surfaceWidth = ''
          applied.surfaceTransform = ''
        }
      }
    } else if (styleResetByReact && applied && host?.seededSurface) {
      const seeded = host.seededSurface
      appliedRadiiMTRef.current = [
        seeded.radii[0],
        seeded.radii[1],
        seeded.radii[2],
        seeded.radii[3],
      ]
      applied.surfaceWidth = seeded.width
      applied.surfaceTransform = seeded.transform
    }
    internalOpsMTRef.current?.applyHorizontal()
    internalOpsMTRef.current?.updateCorners()
  }

  function onClipAttachMT(isNewNode: boolean) {
    'main thread'
    if (!isNewNode) return
    const applied = getHostMT()?.appliedStylesMTRef.current
    if (applied) {
      applied.clipTransform = 'translateY(0px)'
    }
  }

  function onViewportAttachMT() {
    'main thread'
    const host = getHostMT()
    if (!host) return
    const isBottom = host.resolvedSide === 'bottom'
    const initHeight = isBottom
      ? Math.min(
        host.maxSnapSize,
        Math.max(
          0,
          host.viewportSizeMTRef.current.height
            - baseGeometryMTRef.current.bottom,
        ),
      )
      : host.maxSnapSize
    host.appliedStylesMTRef.current.viewportHeight = `${initHeight}px`
  }

  function onHostPropsSyncMT() {
    'main thread'
    const host = getHostMT()
    const inlineKey =
      (host?.styleConfig ?? DEFAULT_STYLE_CONFIG).inlineCornerKey
    const inlineChanged = appliedInlineCornerKeyMTRef.current !== ''
      && appliedInlineCornerKeyMTRef.current !== inlineKey
    appliedInlineCornerKeyMTRef.current = inlineKey
    internalOpsMTRef.current?.applyHorizontal()
    internalOpsMTRef.current?.updateCorners(inlineChanged)
  }

  function onOpenMT() {
    'main thread'
    const host = getHostMT()
    const base = baseGeometryMTRef.current
    const horizontal = host?.resolvedSide === 'left'
      || host?.resolvedSide === 'right'
    const geo = geometryMTRef.current
    geo.hasFrameOverride = false
    geo.hasRadiusOverride = false
    geo.right = base.right
    geo.bottom = base.bottom
    geo.left = base.left
    geo.width = base.width
    geo.maxWidth = base.maxWidth
    geo.align = base.align
    geo.hasHorizontal = !horizontal && base.hasHorizontalSpec
    geo.radii = [
      base.radii[0],
      base.radii[1],
      base.radii[2],
      base.radii[3],
    ]
    geo.bottomUpdatePending = false
    geo.animatingToken += 1
    if (host?.resolvedSide === 'bottom') {
      geo.settledBottom = base.bottom
      host.bodyHubMTRef.current.settledBottom = base.bottom
    }
    internalOpsMTRef.current?.applyHorizontal()
    internalOpsMTRef.current?.updateCorners()
  }

  function attachHostMT(
    nextHostRef: MainThreadRef<InternalSheetSurfaceHostMT | null>,
    element: MainThread.Element | null,
  ) {
    'main thread'
    hostRefMTRef.current = nextHostRef
    const host = nextHostRef.current
    if (appliedInlineCornerKeyMTRef.current === '') {
      appliedInlineCornerKeyMTRef.current =
        (host?.styleConfig ?? DEFAULT_STYLE_CONFIG).inlineCornerKey
    }
    internalOpsMTRef.current = {
      applyHorizontal: applyHorizontalFrameMT,
      updateCorners: updateCornersMT,
      settle: settleSurfaceMT,
    }
    pluginMTRef.current = {
      onSurfaceAttach: onSurfaceAttachMT,
      onClipAttach: onClipAttachMT,
      onViewportAttach: onViewportAttachMT,
      onHostPropsSync: onHostPropsSyncMT,
      onOpen: onOpenMT,
      onSettle: settleSurfaceMT,
      updateVerticalSurface: updateVerticalSurfaceMT,
    }
    const nextBase: BaseSurfaceGeometry = {
      key: baseSyncKey,
      frameKey: frameSyncKey,
      radiusKey: radiusSyncKey,
      right: propRight,
      bottom: propBottom,
      left: propLeft,
      width: propWidth,
      maxWidth: propMaxWidth,
      align: propAlign,
      hasHorizontalSpec: propHasHorizontalSpec,
      radii: [propTL, propTR, propBR, propBL],
    }
    if (baseGeometryMTRef.current.key !== baseSyncKey) {
      const prevBase = baseGeometryMTRef.current
      baseGeometryMTRef.current = nextBase
      applyBaseToLiveMT(nextBase, prevBase)
    } else if (host) {
      const horizontal = host.resolvedSide === 'left'
        || host.resolvedSide === 'right'
      if (horizontal && geometryMTRef.current.hasHorizontal) {
        geometryMTRef.current.hasHorizontal = false
      }
      if (
        !horizontal
        && propHasHorizontalSpec
        && host.bodyHubMTRef.current.horizontalOverride === null
        && geometryMTRef.current.hasHorizontal
      ) {
        const bounds = resolveHorizontalBoundsMT(
          geometryMTRef.current.left,
          geometryMTRef.current.right,
          geometryMTRef.current.width,
          geometryMTRef.current.maxWidth,
          geometryMTRef.current.align,
          host.viewportSizeMTRef.current.width,
          host.enableRTL,
        )
        host.bodyHubMTRef.current.horizontalOverride = bounds
      }
    }
    controllerRef.current = element
      ? {
        setFrame: setFrameMT,
        setCornerRadius: setCornerRadiusMT,
        getViewportSize: getViewportSizeMT,
      }
      : null
  }

  const lastBaseSyncKeyRef = useRef(baseSyncKey)

  useEffect(() => {
    if (lastBaseSyncKeyRef.current === baseSyncKey) {
      return
    }
    lastBaseSyncKeyRef.current = baseSyncKey
    runOnMainThread(() => {
      'main thread'
      internalOpsMTRef.current = {
        applyHorizontal: applyHorizontalFrameMT,
        updateCorners: updateCornersMT,
        settle: settleSurfaceMT,
      }
      const nextBase: BaseSurfaceGeometry = {
        key: baseSyncKey,
        frameKey: frameSyncKey,
        radiusKey: radiusSyncKey,
        right: propRight,
        bottom: propBottom,
        left: propLeft,
        width: propWidth,
        maxWidth: propMaxWidth,
        align: propAlign,
        hasHorizontalSpec: propHasHorizontalSpec,
        radii: [propTL, propTR, propBR, propBL],
      }
      if (baseGeometryMTRef.current.key !== baseSyncKey) {
        const prevBase = baseGeometryMTRef.current
        baseGeometryMTRef.current = nextBase
        applyBaseToLiveMT(nextBase, prevBase)
      }
      const host = getHostMT()
      if (!host) return
      onHostPropsSyncMT()
      host.requestUpdateSurface()
    })()
  }, [
    baseSyncKey,
    frameSyncKey,
    radiusSyncKey,
    propRight,
    propBottom,
    propLeft,
    propWidth,
    propMaxWidth,
    propAlign,
    propHasHorizontalSpec,
    propTL,
    propTR,
    propBR,
    propBL,
  ])

  const handle: InternalSheetSurfaceHandle = {
    controllerRef,
    _internal: {
      pluginMTRef,
      getBaseBottomInset: () => propBottom,
      resolveHostConfig: surfaceStyle => {
        const styleConfig = parseHostStyleConfig(surfaceStyle)
        const styleSyncKey =
          `${styleConfig.inlineCornerKey}|${styleConfig.baseWidth}|${
            styleConfig.baseTransform ?? ''
          }|${styleConfig.baseLeftPx}`
        return { styleConfig, styleSyncKey }
      },
      resolveRenderSeed: (
        resolvedSide: SheetResolvedSide,
        screenWidth: number,
        enableRTL: boolean,
      ): SheetSurfaceRenderSeed => {
        const isHorizontal = resolvedSide === 'left'
          || resolvedSide === 'right'
        const isBottom = resolvedSide === 'bottom'
        const horizontalBounds = isHorizontal
          ? null
          : resolveSurfaceHorizontalFrame(frame, screenWidth, enableRTL)
        const cornerStyle: Record<string, string> = {
          ...(propTL === null ? {} : { borderTopLeftRadius: `${propTL}px` }),
          ...(propTR === null ? {} : { borderTopRightRadius: `${propTR}px` }),
          ...(!isBottom && propBR !== null
            ? { borderBottomRightRadius: `${propBR}px` }
            : {}),
          ...(!isBottom && propBL !== null
            ? { borderBottomLeftRadius: `${propBL}px` }
            : {}),
        }
        return {
          horizontalBounds,
          bottomInset: isBottom ? propBottom : 0,
          cornerStyle,
          seededSurface: {
            width: horizontalBounds ? `${horizontalBounds.width}px` : '',
            transform: horizontalBounds
              ? `translateX(${horizontalBounds.left}px)`
              : '',
            radii: [propTL, propTR, propBR, propBL],
          },
        }
      },
      attachHostMT,
    },
  }
  return handle
}
