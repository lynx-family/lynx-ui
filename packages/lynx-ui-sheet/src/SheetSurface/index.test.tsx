// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it, vi } from 'vitest'

import type { SheetSurfaceController } from '../types'

import { SheetSurface } from './index'
import type { SheetSurfaceProps } from './index'

vi.mock('@lynx-js/react', () => ({
  useEffect: vi.fn(),
  runOnMainThread: <T,>(fn: T) => fn,
}))

vi.mock('../context', () => ({
  SheetDragContext: { Provider: 'drag-provider' },
  SheetFooterContext: { Provider: 'footer-provider' },
  SheetBodyContext: { Provider: 'body-provider' },
}))

vi.stubGlobal('React', {
  createElement: (
    type: unknown,
    props: object | null,
    ...children: unknown[]
  ) => ({
    type,
    props: {
      ...props,
      children: children.length === 1 ? children[0] : children,
    },
  }),
})

interface ViewProps {
  children: unknown
  id?: string
  style: Record<string, unknown>
  'main-thread:gesture'?: unknown
  'main-thread:bindtouchstart'?: unknown
  'main-thread:ref': (element: unknown) => void
}

function renderSurface(overrides: Partial<SheetSurfaceProps> = {}) {
  const measure = vi.fn()
  const gesture = {} as NonNullable<SheetSurfaceProps['sheetGesture']>
  const setInsetsMT = vi.fn()
  const setCornerRadiusMT = vi.fn()
  const surface = SheetSurface({
    resolvedSide: 'bottom',
    snapPoints: [400, 800],
    maxSnapSize: 800,
    screenWidth: 1000,
    dragHandlers: {},
    sheetGesture: gesture,
    footerContext: {
      resolvedSide: 'bottom',
      setFooterMTRef: vi.fn(),
      updateFooterHeightMT: vi.fn(),
    },
    bodyContext: {
      enabled: true,
      setBodyMTRef: vi.fn(),
      measureBodyMT: vi.fn(),
    },
    setSheetMTRef: vi.fn(),
    measureSurfaceMT: vi.fn(),
    setClipMTRef: vi.fn(),
    setSurfaceMTRef: vi.fn(),
    setViewportMTRef: vi.fn(),
    setContentMTRef: measure,
    setInsetsMT,
    setCornerRadiusMT,
    handleSheetLayoutChangeMT: vi.fn(),
    ...overrides,
  }) as unknown as { props: ViewProps }
  const movement = surface.props.children as { props: ViewProps }
  const painted = movement.props.children as { props: ViewProps }
  const viewport = painted.props.children as { props: ViewProps }
  const panel = viewport.props.children as { props: ViewProps }
  return {
    surface,
    movement,
    painted,
    viewport,
    panel,
    measure,
    gesture,
    setInsetsMT,
    setCornerRadiusMT,
  }
}

describe('Sheet surface composition', () => {
  it('exposes the stateless SheetSurfaceController on mount and clears it on detach', () => {
    const surfaceControllerRef = {
      current: null as SheetSurfaceController | null,
    }
    const setSurfaceMTRef = vi.fn()
    const setSheetMTRef = vi.fn()
    const { painted, movement, setInsetsMT, setCornerRadiusMT } = renderSurface(
      {
        'main-thread:surfaceControllerRef': surfaceControllerRef,
        setSurfaceMTRef,
        setSheetMTRef,
      },
    )
    const movementElement = { setStyleProperties: vi.fn() }
    const element = { setStyleProperties: vi.fn() }

    movement.props['main-thread:ref'](movementElement)
    painted.props['main-thread:ref'](element)
    expect(setSheetMTRef).toHaveBeenCalledWith(movementElement)
    expect(setSurfaceMTRef).toHaveBeenCalledWith(element)
    expect(surfaceControllerRef.current).not.toBeNull()
    surfaceControllerRef.current?.setInsets({ bottom: 0, left: 0, right: 0 })
    surfaceControllerRef.current?.setCornerRadius(0)
    expect(setInsetsMT).toHaveBeenCalledWith({ bottom: 0, left: 0, right: 0 })
    expect(setCornerRadiusMT).toHaveBeenCalledWith(0)
    expect(painted.props).not.toHaveProperty('main-thread:surfaceControllerRef')

    painted.props['main-thread:ref'](null)
    expect(setSurfaceMTRef).toHaveBeenLastCalledWith(null)
    expect(surfaceControllerRef.current).toBeNull()
  })

  it('keeps the Sheet measurement ref on the inner panel', () => {
    const { panel, measure } = renderSurface()
    const element = { setStyleProperties: vi.fn() }
    panel.props['main-thread:ref'](element)
    expect(measure).toHaveBeenCalledWith(element)
  })

  it('attaches dragging to the painted surface and lets the outer layer pass taps', () => {
    const handleTouchStartMT = vi.fn()
    const { surface, movement, painted, panel, gesture } = renderSurface({
      innerStyle: { width: '300px', left: '20px' },
      dragHandlers: { handleTouchStartMT },
    })
    expect(surface.props.style).toMatchObject({
      pointerEvents: 'none',
      overflow: 'hidden',
      width: '100%',
    })
    expect(movement.props.style.overflow).toBe('visible')
    expect(surface.props['main-thread:gesture']).toBeUndefined()
    expect(movement.props['main-thread:gesture']).toBeUndefined()
    expect(painted.props['main-thread:gesture']).toBe(gesture)
    expect(painted.props['main-thread:bindtouchstart']).toBe(
      handleTouchStartMT,
    )
    expect(panel.props['main-thread:gesture']).toBeUndefined()
    expect(panel.props['main-thread:bindtouchstart']).toBeUndefined()
    expect(panel.props.style).toMatchObject({
      width: '300px',
      left: '20px',
      height: '100%',
      pointerEvents: 'auto',
    })
  })

  it('forwards inner view properties without replacing Sheet-owned styles', () => {
    const { panel } = renderSurface({
      innerViewProps: { id: 'sheet-panel', style: { width: '1px' } },
      innerStyle: { width: '300px' },
    })
    expect(panel.props.id).toBe('sheet-panel')
    expect(panel.props.style.width).toBe('300px')
  })

  it('keeps handle-only dragging off the surface and inner panel', () => {
    const handleTouchStartMT = vi.fn()
    const { painted, panel } = renderSurface({
      handleOnly: true,
      dragHandlers: { handleTouchStartMT },
    })
    expect(painted.props['main-thread:gesture']).toBeUndefined()
    expect(painted.props['main-thread:bindtouchstart']).toBeUndefined()
    expect(panel.props['main-thread:gesture']).toBeUndefined()
    expect(panel.props['main-thread:bindtouchstart']).toBeUndefined()
  })

  it('keeps vertical fit sheets draggable on empty surface space and horizontal sheets draggable on content', () => {
    const handleTouchStartMT = vi.fn()
    const verticalFit = renderSurface({
      resolvedSide: 'bottom',
      snapPoints: ['fit', '100%'],
      dragHandlers: { handleTouchStartMT },
    })
    expect(verticalFit.painted.props['main-thread:gesture']).toBe(
      verticalFit.gesture,
    )
    expect(verticalFit.painted.props['main-thread:bindtouchstart']).toBe(
      handleTouchStartMT,
    )
    expect(verticalFit.panel.props['main-thread:gesture']).toBeUndefined()

    const horizontal = renderSurface({
      resolvedSide: 'right',
      dragHandlers: { handleTouchStartMT },
    })
    expect(horizontal.surface.props['main-thread:gesture']).toBeUndefined()
    expect(horizontal.movement.props['main-thread:gesture']).toBe(
      horizontal.gesture,
    )
    expect(horizontal.movement.props['main-thread:bindtouchstart']).toBe(
      handleTouchStartMT,
    )
  })

  it('computes initial horizontal surface bounds from insets without leaking insets to native props', () => {
    const child = { type: 'scroll-view' }
    const attached = renderSurface({ children: child })
    const floating = renderSurface({
      insets: { left: 88, right: 88, bottom: 8 },
      screenWidth: 840,
      children: child,
    })
    expect(floating.painted.props).not.toHaveProperty('insets')
    expect(floating.painted.props.style.left).toBe('88px')
    expect(floating.painted.props.style.width).toBe('664px')
    expect(floating.painted.props['main-thread:gesture']).toBe(floating.gesture)
    expect(floating.panel.props['main-thread:gesture']).toBeUndefined()
    expect(floating.panel.props.style).toEqual(attached.panel.props.style)
    expect(floating.viewport.props.style.height).toBe('800px')
  })

  it('keeps cornerRadius out of the native view props', () => {
    const { painted, panel } = renderSurface({ cornerRadius: 24 })
    expect(painted.props).not.toHaveProperty('cornerRadius')
    expect(panel.props).not.toHaveProperty('cornerRadius')
  })
})
