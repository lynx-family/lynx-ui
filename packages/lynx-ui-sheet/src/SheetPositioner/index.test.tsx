// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it, vi } from 'vitest'

import { SheetPositioner } from './index'

const hooks = vi.hoisted(() => ({
  state: null as unknown,
  setState: vi.fn(),
  refs: [] as Array<{ current: unknown }>,
  refCursor: 0,
}))

vi.mock('@lynx-js/react', () => ({
  useContext: () => null,
  useMemo: <T,>(fn: () => T) => fn(),
  useRef: <T,>(initial: T) => {
    const index = hooks.refCursor++
    hooks.refs[index] ??= { current: initial }
    return hooks.refs[index] as { current: T }
  },
  useEffect: (fn: () => void) => fn(),
  useState: <T,>(initial: T) => {
    hooks.state ??= initial
    return [
      hooks.state,
      (updater: T | ((prev: T) => T)) => {
        const next = typeof updater === 'function'
          ? (updater as (prev: T) => T)(hooks.state as T)
          : updater
        hooks.state = next
        hooks.setState(next)
      },
    ]
  },
}))

vi.mock('../context', () => ({
  SheetContext: {},
  SheetPositionerContext: { Provider: 'positioner-provider' },
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

describe('SheetPositioner', () => {
  it('provides synchronous dimensions when explicit width and height are passed', () => {
    hooks.state = null
    hooks.refs = []
    hooks.refCursor = 0
    hooks.setState.mockClear()
    const onSizeChange = vi.fn()
    const renderExplicit = (width: number, height: number) => {
      hooks.refCursor = 0
      return SheetPositioner({ width, height, onSizeChange }) as unknown as {
        props: {
          value: { width: number, height: number } | null
          children: {
            props: {
              style: Record<string, unknown>
              bindlayoutchange?: unknown
            }
          }
        }
      }
    }
    const tree = renderExplicit(320, 640)
    expect(tree.props.value).toEqual({ width: 320, height: 640 })
    expect(onSizeChange).toHaveBeenCalledTimes(1)
    expect(onSizeChange).toHaveBeenLastCalledWith({ width: 320, height: 640 })

    // Deduplicates identical dimensions and re-fires on resize.
    renderExplicit(320, 640)
    expect(onSizeChange).toHaveBeenCalledTimes(1)
    renderExplicit(360, 640)
    expect(onSizeChange).toHaveBeenCalledTimes(2)
    expect(onSizeChange).toHaveBeenLastCalledWith({ width: 360, height: 640 })

    expect(tree.props.children.props.style).toMatchObject({
      width: '320px',
      height: '640px',
      pointerEvents: 'none',
    })
    expect(
      (tree.props.children.props as Record<string, unknown>)['event-through'],
    )
      .toBe(true)
    expect(tree.props.children.props.bindlayoutchange).toBeUndefined()
  })

  it('auto-measures inset:0 bounds when width and height are omitted', () => {
    hooks.state = null
    hooks.refs = []
    hooks.refCursor = 0
    hooks.setState.mockClear()
    const onSizeChange = vi.fn()
    const renderAuto = () => {
      hooks.refCursor = 0
      return SheetPositioner({ onSizeChange }) as unknown as {
        props: {
          value: { width: number, height: number } | null
          children: {
            props: {
              style: Record<string, unknown>
              bindlayoutchange: (
                event: { detail: { width: number, height: number } },
              ) => void
            }
          }
        }
      }
    }
    const initial = renderAuto()
    expect(initial.props.value).toBeNull()
    expect(onSizeChange).not.toHaveBeenCalled()
    expect(initial.props.children.props.style).toMatchObject({
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    })

    initial.props.children.props.bindlayoutchange({
      detail: { width: 412, height: 892 },
    })
    const measured = renderAuto()
    expect(measured.props.value).toEqual({ width: 412, height: 892 })
    expect(onSizeChange).toHaveBeenCalledTimes(1)
    expect(onSizeChange).toHaveBeenLastCalledWith({ width: 412, height: 892 })

    // Repeats of identical bounds are deduplicated; resized bounds notify again.
    initial.props.children.props.bindlayoutchange({
      detail: { width: 412, height: 892 },
    })
    renderAuto()
    expect(onSizeChange).toHaveBeenCalledTimes(1)

    initial.props.children.props.bindlayoutchange({
      detail: { width: 768, height: 1024 },
    })
    renderAuto()
    expect(onSizeChange).toHaveBeenCalledTimes(2)
    expect(onSizeChange).toHaveBeenLastCalledWith({
      width: 768,
      height: 1024,
    })
  })

  it('parses px and numeric style edge offsets to seed pre-measure context without firing onSizeChange', () => {
    hooks.state = null
    hooks.refs = []
    hooks.refCursor = 0
    hooks.setState.mockClear()
    const onSizeChange = vi.fn()
    const renderInsetAuto = () => {
      hooks.refCursor = 0
      return SheetPositioner({
        style: { left: '40px', right: 20, top: '10px', bottom: '10%' },
        onSizeChange,
      }) as unknown as {
        props: {
          value: {
            width?: number
            height?: number
            insetX?: number
            insetY?: number
          } | null
          children: {
            props: {
              style: Record<string, unknown>
              bindlayoutchange: (
                event: { detail: { width: number, height: number } },
              ) => void
            }
          }
        }
      }
    }
    const initial = renderInsetAuto()
    expect(initial.props.value).toEqual({ insetX: 60, insetY: 10 })
    expect(onSizeChange).not.toHaveBeenCalled()
    expect(initial.props.children.props.style).toMatchObject({
      left: '40px',
      top: '10px',
      right: 20,
      bottom: '10%',
    })

    initial.props.children.props.bindlayoutchange({
      detail: { width: 780, height: 900 },
    })
    const measured = renderInsetAuto()
    expect(measured.props.value).toEqual({ width: 780, height: 900 })
    expect(onSizeChange).toHaveBeenCalledTimes(1)
    expect(onSizeChange).toHaveBeenLastCalledWith({ width: 780, height: 900 })
  })

  it('throws when an explicit dimension is non-positive', () => {
    hooks.refs = []
    hooks.refCursor = 0
    expect(() => SheetPositioner({ width: 0, height: 400 })).toThrow()
    hooks.refs = []
    hooks.refCursor = 0
    expect(() => SheetPositioner({ width: 400, height: -10 })).toThrow()
  })
})
