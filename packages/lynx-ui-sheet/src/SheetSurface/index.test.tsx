// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it, vi } from 'vitest'

import { SheetSurface } from './index'
import type { SheetSurfaceProps } from './index'

vi.mock('../context', () => ({
  SheetDragContext: { Provider: 'drag-provider' },
  SheetFooterContext: { Provider: 'footer-provider' },
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
  'main-thread:ref': (element: unknown) => void
}

function renderSurface(overrides: Partial<SheetSurfaceProps> = {}) {
  const measure = vi.fn()
  const gesture = {} as NonNullable<SheetSurfaceProps['sheetGesture']>
  const surface = SheetSurface({
    resolvedSide: 'bottom',
    snapPoints: [400, 800],
    maxSnapSize: 800,
    dragHandlers: {},
    sheetGesture: gesture,
    footerContext: {
      resolvedSide: 'bottom',
      registerFooter: vi.fn(),
      unregisterFooter: vi.fn(),
    },
    setSheetMTRef: vi.fn(),
    setSurfaceMTRef: vi.fn(),
    setViewportMTRef: vi.fn(),
    setContentMTRef: measure,
    handleSheetLayoutChangeMT: vi.fn(),
    ...overrides,
  }) as unknown as { props: ViewProps }
  const painted = surface.props.children as { props: ViewProps }
  const viewport = painted.props.children as { props: ViewProps }
  const panel = viewport.props.children as { props: ViewProps }
  return { surface, painted, viewport, panel, measure, gesture }
}

describe('Sheet surface composition', () => {
  it('keeps the Sheet measurement ref on the inner panel', () => {
    const { panel, measure } = renderSurface()
    const element = { setStyleProperties: vi.fn() }
    panel.props['main-thread:ref'](element)
    expect(measure).toHaveBeenCalledWith(element)
  })

  it('attaches dragging to the styled panel and lets the outer layer pass taps', () => {
    const { surface, panel, gesture } = renderSurface({
      innerStyle: { width: '300px', left: '20px' },
    })
    expect(surface.props.style).toMatchObject({
      pointerEvents: 'none',
      overflow: 'visible',
      width: '100%',
    })
    expect(surface.props['main-thread:gesture']).toBeUndefined()
    expect(panel.props.style).toMatchObject({
      width: '300px',
      left: '20px',
      height: '100%',
      pointerEvents: 'auto',
    })
    expect(panel.props['main-thread:gesture']).toBe(gesture)
  })

  it('forwards inner view properties without replacing Sheet-owned styles', () => {
    const { panel } = renderSurface({
      innerViewProps: { id: 'sheet-panel', style: { width: '1px' } },
      innerStyle: { width: '300px' },
    })
    expect(panel.props.id).toBe('sheet-panel')
    expect(panel.props.style.width).toBe('300px')
  })

  it('keeps handle-only dragging off the panel', () => {
    const { panel } = renderSurface({ handleOnly: true })
    expect(panel.props['main-thread:gesture']).toBeUndefined()
  })
})

it('keeps one content tree when switching detached coverage', () => {
  const child = { type: 'scroll-view' }
  const attached = renderSurface({ children: child })
  const floating = renderSurface({
    detached: true,
    bottomInset: 8,
    children: child,
  })
  expect(floating.surface.props).not.toHaveProperty('detached')
  expect(floating.painted.props).not.toHaveProperty('bottomInset')
  expect(floating.painted.props.style.height).toBe(
    attached.painted.props.style.height,
  )
  expect(floating.viewport.props.style.height).toBe('800px')
})
