// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it, vi } from 'vitest'

import { getInternalSheetSurface } from '../context'
import type * as SheetContextModule from '../context'
import type { SheetSurfaceBodyHubMT } from '../context'
import { useSheetSurface } from '../hooks/useSheetSurface'
import type {
  SheetCornerRadius,
  SheetSurfaceFrame,
  SheetSurfaceHandle,
} from '../types'

import { SheetSurface } from './index'
import type { SheetSurfaceProps } from './index'

const refs = vi.hoisted(() => ({
  slots: [] as Array<{ current: unknown }>,
  cursor: 0,
}))

vi.mock('@lynx-js/react', () => ({
  createContext: () => ({ Provider: 'context-provider' }),
  useEffect: vi.fn(),
  useMemo: <T,>(fn: () => T) => fn(),
  useMainThreadRef: <T,>(initialValue: T) => {
    const index = refs.cursor++
    refs.slots[index] ??= { current: initialValue }
    return refs.slots[index] as { current: T }
  },
  useRef: <T,>(initialValue: T) => {
    const index = refs.cursor++
    refs.slots[index] ??= { current: initialValue }
    return refs.slots[index] as { current: T }
  },
  runOnMainThread: <T,>(fn: T) => fn,
}))

vi.mock('@lynx-js/lynx-ui-common', () => ({
  noop: () => undefined,
  useMemoizedFn: <T,>(fn: T) => fn,
  useStrictContext: () => [{}],
}))

vi.mock('../context', async importOriginal => {
  const actual = await importOriginal<typeof SheetContextModule>()
  return {
    ...actual,
    SheetDragContext: { Provider: 'drag-provider' },
    SheetFooterContext: { Provider: 'footer-provider' },
    SheetBodyContext: { Provider: 'body-provider' },
  }
})

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
  'main-thread:ref'?: (element: unknown) => void
}

function renderSurface(
  overrides: Partial<SheetSurfaceProps> & {
    frame?: SheetSurfaceFrame
    cornerRadius?: SheetCornerRadius
  } = {},
) {
  refs.slots = []
  refs.cursor = 0
  const measure = vi.fn()
  const gesture = {} as NonNullable<SheetSurfaceProps['sheetGesture']>
  const hubMTRef = {
    current: {
      nextId: 0,
      subscribers: [],
      hasRange: false,
      rangeStart: 0,
      rangeSize: 0,
      surfaceLeft: 0,
      surfaceTop: 0,
      horizontalOverride: null,
      parentRect: {},
      settledBottom: 0,
    } as SheetSurfaceBodyHubMT,
  }
  const buildTree = (
    nextOverrides: Partial<SheetSurfaceProps> & {
      frame?: SheetSurfaceFrame
      cornerRadius?: SheetCornerRadius
    } = {},
  ) => {
    refs.cursor = 0
    const merged = { ...overrides, ...nextOverrides }
    const {
      frame,
      cornerRadius,
      surface: explicitSurface,
      ...restOverrides
    } = merged
    let surfaceHandle: SheetSurfaceHandle | undefined = explicitSurface
    if (
      surfaceHandle === undefined
      && (frame !== undefined || cornerRadius !== undefined)
    ) {
      // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for unit tests.
      surfaceHandle = useSheetSurface({ frame, cornerRadius })
    }
    const surface = SheetSurface({
      resolvedSide: 'bottom',
      enableRTL: false,
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
        resolvedSide: 'bottom',
        enableRTL: false,
        viewportWidth: 1000,
        viewportHeight: 800,
        maxSnapSize: 800,
        hasFitSnapPoint: false,
        initialBottomInset: 0,
        hubMTRef,
      },
      setSheetMTRef: vi.fn(),
      measureSurfaceMT: vi.fn(),
      setClipMTRef: vi.fn(),
      setSurfaceMTRef: vi.fn(),
      setViewportMTRef: vi.fn(),
      setContentMTRef: measure,
      handleSheetLayoutChangeMT: vi.fn(),
      surface: surfaceHandle,
      ...restOverrides,
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
      surfaceHandle,
    }
  }
  return {
    ...buildTree(),
    rerender: buildTree,
  }
}

describe('Sheet surface composition', () => {
  it('omits clip ref when surface handle is absent and binds painted ref when surface is provided', () => {
    const attached = renderSurface()
    expect(attached.surface.props['main-thread:ref']).toBeUndefined()

    refs.slots = []
    refs.cursor = 0
    // rslint-disable-next-line react-hooks/rules-of-hooks -- React bindings are mocked for unit tests.
    const handle = useSheetSurface({
      frame: { insets: { bottom: 8 } },
      cornerRadius: 24,
    })
    const setClipMTRef = vi.fn()
    const setSurfaceMTRef = vi.fn((el: unknown) => {
      getInternalSheetSurface(handle)?.attachHostMT(
        { current: null },
        el as never,
      )
    })
    const floating = renderSurface({
      surface: handle,
      setClipMTRef,
      setSurfaceMTRef,
    })
    expect(floating.surface.props['main-thread:ref']).toBe(setClipMTRef)
    expect(floating.painted.props).not.toHaveProperty('surface')

    const element = { setStyleProperties: vi.fn() }
    floating.painted.props['main-thread:ref']?.(element)
    expect(setSurfaceMTRef).toHaveBeenCalledWith(element, expect.any(String))
    expect(handle.controllerRef.current).not.toBeNull()

    floating.painted.props['main-thread:ref']?.(null)
    expect(setSurfaceMTRef).toHaveBeenLastCalledWith(null)
    expect(handle.controllerRef.current).toBeNull()
  })

  it('keeps the Sheet measurement ref on the inner panel', () => {
    const { panel, measure } = renderSurface()
    const element = { setStyleProperties: vi.fn() }
    panel.props['main-thread:ref']?.(element)
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

  it('computes initial horizontal surface bounds from useSheetSurface without leaking props', () => {
    const child = { type: 'scroll-view' }
    const attached = renderSurface({ children: child })
    const floating = renderSurface({
      frame: { insets: { left: 88, right: 88, bottom: 8 } },
      screenWidth: 840,
      children: child,
    })
    expect(floating.painted.props).not.toHaveProperty('surface')
    expect(floating.painted.props.style.transform).toBe('translateX(88px)')
    expect(floating.painted.props.style.left).toBeUndefined()
    expect(floating.painted.props.style.width).toBe('664px')
    expect(floating.painted.props['main-thread:gesture']).toBe(floating.gesture)
    expect(floating.panel.props['main-thread:gesture']).toBeUndefined()
    expect(floating.panel.props.style).toEqual(attached.panel.props.style)
    expect(floating.viewport.props.style.height).toBe('800px')

    const maxCard = renderSurface({
      frame: {
        insets: { left: 16, right: 16, bottom: 8 },
        maxWidth: 664,
      },
      screenWidth: 1000,
      children: child,
    })
    expect(maxCard.painted.props.style.transform).toBe('translateX(168px)')
    expect(maxCard.painted.props.style.width).toBe('664px')

    const percentCard = renderSurface({
      frame: { width: '80%' },
      screenWidth: 500,
      children: child,
    })
    expect(percentCard.painted.props.style.transform).toBe('translateX(50px)')
    expect(percentCard.painted.props.style.width).toBe('400px')

    const rtlAligned = renderSurface({
      frame: {
        insets: { left: 20, right: 40 },
        width: 500,
        align: 'start',
      },
      screenWidth: 1000,
      enableRTL: true,
      children: child,
    })
    expect(rtlAligned.painted.props.style.transform).toBe('translateX(460px)')
    expect(rtlAligned.painted.props.style.width).toBe('500px')
  })

  it('seeds Frame-0 horizontal bounds and freezes JSX styles across rerenders', () => {
    const mounted = renderSurface({
      frame: { insets: { left: 60, right: 80, bottom: 8 } },
      screenWidth: 1000,
    })
    expect(mounted.painted.props.style.transform).toBe('translateX(60px)')
    expect(mounted.painted.props.style.width).toBe('860px')

    const updated = mounted.rerender({
      frame: { insets: { left: 10, right: 10, bottom: 0 } },
      screenWidth: 1000,
    })
    expect(updated.painted.props.style.transform).toBe('translateX(60px)')
    expect(updated.painted.props.style.width).toBe('860px')
  })

  it('seeds Frame-0 JSX corner radii without leaking surface props', () => {
    const { painted, panel } = renderSurface({ cornerRadius: 24 })
    expect(painted.props).not.toHaveProperty('surface')
    expect(panel.props).not.toHaveProperty('surface')
    expect(painted.props.style.borderTopLeftRadius).toBe('24px')
    expect(painted.props.style.borderTopRightRadius).toBe('24px')
    expect(painted.props.style.borderBottomLeftRadius).toBeUndefined()
    expect(painted.props.style.borderBottomRightRadius).toBeUndefined()
  })

  it('seeds Frame-0 horizontal bounds with positioner pre-measure width', () => {
    const mounted = renderSurface({
      frame: { insets: { left: 16, right: 16, bottom: 8 }, maxWidth: '664px' },
      cornerRadius: 24,
      positioner: { insetX: 60, insetY: 0 },
      screenWidth: 840,
    })
    expect(mounted.painted.props.style.transform).toBe('translateX(88px)')
    expect(mounted.painted.props.style.width).toBe('664px')
    expect(mounted.painted.props.style.height).toBe('150vh')
    expect(mounted.movement.props.style.height).toBe('150vh')
  })

  it('disables host implicit-animation on the painted surface by default and applies fitMaxSize for fit-only sheets', () => {
    const verticalFit = renderSurface({
      resolvedSide: 'bottom',
      snapPoints: [{ fit: { max: 520 } }],
      maxSnapSize: 0,
      fitMaxSize: 520,
    })
    expect(
      (verticalFit.painted.props as Record<string, unknown>)[
        'implicit-animation'
      ],
    ).toBe('false')
    expect(verticalFit.panel.props.style.maxHeight).toBe('520px')

    const multiSnap = renderSurface({
      resolvedSide: 'bottom',
      snapPoints: [{ fit: { max: 520 } }, '100%'],
      maxSnapSize: 800,
      fitMaxSize: 520,
    })
    expect(multiSnap.panel.props.style.maxHeight).toBeUndefined()

    const horizontalFit = renderSurface({
      resolvedSide: 'right',
      snapPoints: [{ fit: { max: 420 } }],
      maxSnapSize: 0,
      fitMaxSize: 420,
    })
    expect(horizontalFit.movement.props.style.maxWidth).toBe('420px')

    const customImplicit = renderSurface({
      surfaceViewProps: { 'implicit-animation': true },
    })
    expect(
      (customImplicit.painted.props as Record<string, unknown>)[
        'implicit-animation'
      ],
    ).toBe(true)
  })
})
