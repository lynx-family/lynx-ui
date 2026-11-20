// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it, vi } from 'vitest'

import { SheetPositioner } from './index'

const hooks = vi.hoisted(() => ({
  state: null as unknown,
  setState: vi.fn(),
}))

vi.mock('@lynx-js/react', () => ({
  useMemo: <T,>(fn: () => T) => fn(),
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
    hooks.setState.mockClear()
    const tree = SheetPositioner({ width: 320, height: 640 }) as unknown as {
      props: {
        value: { width: number, height: number } | null
        children: {
          props: { style: Record<string, unknown>, bindlayoutchange?: unknown }
        }
      }
    }
    expect(tree.props.value).toEqual({ width: 320, height: 640 })
    expect(tree.props.children.props.style).toMatchObject({
      width: '320px',
      height: '640px',
    })
    expect(tree.props.children.props.bindlayoutchange).toBeUndefined()
  })

  it('auto-measures inset:0 bounds when width and height are omitted', () => {
    hooks.state = null
    hooks.setState.mockClear()
    const initial = SheetPositioner({}) as unknown as {
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
    expect(initial.props.value).toBeNull()
    expect(initial.props.children.props.style).toMatchObject({
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    })

    initial.props.children.props.bindlayoutchange({
      detail: { width: 412, height: 892 },
    })
    const measured = SheetPositioner({}) as unknown as {
      props: { value: { width: number, height: number } | null }
    }
    expect(measured.props.value).toEqual({ width: 412, height: 892 })
  })

  it('throws when an explicit dimension is non-positive', () => {
    expect(() => SheetPositioner({ width: 0, height: 400 })).toThrow()
    expect(() => SheetPositioner({ width: 400, height: -10 })).toThrow()
  })
})
