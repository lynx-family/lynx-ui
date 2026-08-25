// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { mtsLog } from '@lynx-js/lynx-ui-common'
import type { MainThread } from '@lynx-js/types'
import { describe, expect, it, vi } from 'vitest'

import type { useDragOptions } from '../../lynx-ui-draggable/src/types/index.docs'
import { useDraggable } from '../../lynx-ui-draggable/src/useDraggable'
import { commitSortableOrder } from '../src/commitSortableOrder'
import { useSortable } from '../src/useSortable'

// These unit tests model hook identity and explicit order commits, not native
// scheduling or event binding. Native binding counts require a device trace.
const hooks = vi.hoisted(() => {
  interface Cell {
    value: unknown
    deps?: readonly unknown[]
  }
  let cells: Cell[] = []
  let cursor = 0
  function memo<T>(factory: () => T, deps: readonly unknown[]): T {
    const index = cursor++
    const previous = cells[index]
    if (
      previous?.deps?.length !== deps.length
      || deps.some((value, i) => !Object.is(value, previous.deps?.[i]))
    ) {
      cells[index] = { value: factory(), deps }
    }
    return cells[index].value as T
  }
  function ref<T>(value: T) {
    return memo(() => ({ current: value }), [])
  }
  return {
    ref,
    memo,
    create() {
      const state: Cell[] = []
      return <T>(render: () => T): T => {
        cells = state
        cursor = 0
        return render()
      }
    },
  }
})

vi.mock('@lynx-js/react', () => ({
  useRef: hooks.ref,
  useMainThreadRef: hooks.ref,
  useMemo: hooks.memo,
  useCallback: <T>(callback: T, deps: readonly unknown[]) =>
    hooks.memo(() => callback, deps),
  runOnBackground: <T>(callback: T) => callback,
}))

vi.mock('@lynx-js/lynx-ui-common', async () => {
  const { useLatest } = await import('../../lynx-ui-common/src/hooks/useLatest')
  return { useLatest, mtsLog: vi.fn() }
})

const event = (y = 0) =>
  ({ button: 0, pageX: 0, pageY: y }) as MainThread.MouseEvent
const row = (key: string, title = key) => ({
  dataItem: { title },
  getSortingKey: () => key,
})
const keys = (data: ReturnType<typeof row>[]) =>
  data.map(item => item.getSortingKey())

function setupSortable(count = 90) {
  const render = hooks.create()
  const data = Array.from({ length: count }, (_, index) => row(String(index)))
  const orderRef = { current: keys(data) }
  const options = {
    data,
    orderRef,
    sizeMap: {
      current: Object.fromEntries(orderRef.current.map(key => [key, 100])),
    },
    itemRefMap: { current: {} },
    itemMTSRefMap: { current: {} },
    dirtyKeysRef: { current: {} },
    disabledKeysRef: { current: {} as Record<string, boolean> },
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
  }
  return { render, options, orderRef }
}

describe('stable sortable actions', () => {
  it('refreshes captured debug flags only when the flag changes', () => {
    const { render, options } = setupSortable(3)
    const update = (debugLog: boolean) =>
      render(() => useSortable({ ...options, debugLog }))
    const disabled = update(false)
    const stillDisabled = update(false)
    expect(stillDisabled.handleDragMove).toBe(disabled.handleDragMove)

    for (const debugLog of [true, false]) {
      const actions = update(debugLog)
      const repeated = update(debugLog)
      expect(repeated.handleDragStart).toBe(actions.handleDragStart)
      expect(repeated.handleDragMove).toBe(actions.handleDragMove)
      expect(repeated.handleDragEnd).toBe(actions.handleDragEnd)

      vi.mocked(mtsLog).mockClear()
      actions.handleDragMove({ x: 0, y: 0 }, 'missing', event())
      actions.handleDragStart({ x: 0, y: 0 }, '0', event())
      actions.handleDragMove({ x: 0, y: 180 }, '0', event(180))
      actions.handleDragEnd('0', event(180))
      expect(mtsLog).toHaveBeenCalled()
      expect(vi.mocked(mtsLog).mock.calls.every(([flag]) => flag === debugLog))
        .toBe(true)
    }
  })

  it('preserves all actions after a three-position change in a 90-item list', () => {
    const { render, options, orderRef } = setupSortable()
    const before = render(() => useSortable(options))
    options.data = [
      options.data[1],
      options.data[2],
      options.data[0],
      ...options.data.slice(3),
    ]
    options.onDragEnd = vi.fn()
    options.onDragStart = vi.fn()
    const after = render(() => useSortable(options))
    orderRef.current = keys(options.data)
    expect(after.handleDragStart).toBe(before.handleDragStart)
    expect(after.handleDragMove).toBe(before.handleDragMove)
    expect(after.handleDragEnd).toBe(before.handleDragEnd)
    before.handleDragStart({ x: 0, y: 0 }, '0', event())
    expect(options.onDragStart).toHaveBeenCalledWith('0')
  })

  it('uses the newly committed order on consecutive drags', () => {
    const { render, options, orderRef } = setupSortable(5)
    const actions = render(() => useSortable(options))
    actions.handleDragStart({ x: 0, y: 0 }, '0', event())
    actions.handleDragMove({ x: 0, y: 180 }, '0', event(180))
    expect(actions.handleDragEnd('0', event(180))).toBe(true)
    options.data = options.onDragEnd.mock.calls[0][0]
    expect(keys(options.data)).toEqual(['1', '2', '0', '3', '4'])
    render(() => useSortable(options))
    orderRef.current = keys(options.data)
    actions.handleDragStart({ x: 0, y: 0 }, '0', event())
    actions.handleDragMove({ x: 0, y: -180 }, '0', event(-180))
    expect(actions.handleDragEnd('0', event(-180))).toBe(true)
    expect(keys(options.onDragEnd.mock.calls[1][0])).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
    ])
  })

  it('reads current business data and callbacks without changing actions', () => {
    const { render, options } = setupSortable(3)
    const actions = render(() => useSortable(options))
    const oldCallback = options.onDragEnd
    options.data = options.data.map(item =>
      row(item.getSortingKey(), 'updated')
    )
    options.onDragEnd = vi.fn()
    render(() => useSortable(options))
    actions.handleDragStart({ x: 0, y: 0 }, '0', event())
    expect(actions.handleDragEnd('0', event())).toBe(false)
    expect(oldCallback).not.toHaveBeenCalled()
    expect(options.onDragEnd).toHaveBeenCalledWith(options.data)
  })

  it('keeps disabled positions locked and reads disabled changes through the ref', () => {
    const { render, options } = setupSortable(5)
    const actions = render(() => useSortable(options))
    options.disabledKeysRef.current['1'] = true
    actions.handleDragStart({ x: 0, y: 0 }, '0', event())
    actions.handleDragMove({ x: 0, y: 280 }, '0', event(280))
    actions.handleDragEnd('0', event(280))
    expect(keys(options.onDragEnd.mock.calls[0][0])).toEqual([
      '2',
      '1',
      '3',
      '0',
      '4',
    ])
  })

  it('does not retain a confirmed swap into the next stationary gesture', () => {
    const { render, options, orderRef } = setupSortable(5)
    const actions = render(() => useSortable(options))
    actions.handleDragStart({ x: 0, y: 0 }, '0', event())
    actions.handleDragMove({ x: 0, y: 180 }, '0', event(180))
    actions.handleDragEnd('0', event(180))
    options.data = options.onDragEnd.mock.calls[0][0]
    render(() => useSortable(options))
    orderRef.current = keys(options.data)
    actions.handleDragStart({ x: 0, y: 0 }, '0', event())
    expect(actions.handleDragEnd('0', event())).toBe(false)
    expect(options.onDragEnd.mock.calls[1][0]).toEqual(options.data)
  })
})

function setupDraggable() {
  const render = hooks.create()
  const setStyleProperty = vi.fn()
  const options = {
    draggableNodeRef: {
      current: {
        setStyleProperty,
        setStyleProperties: vi.fn(),
      } as unknown as MainThread.Element,
    },
    trigger: 'immediate' as const,
    onDragStart: vi.fn(),
    onDragging: vi.fn(),
    onDragEnd: vi.fn(),
  }
  return { render, options, setStyleProperty }
}

describe('committing order and visual cleanup', () => {
  it('updates order before resetting only the three dirty items out of 90', () => {
    const original = Array.from({ length: 90 }, (_, index) => String(index))
    const nextOrder = ['1', '2', '0', ...original.slice(3)]
    const orderRef = { current: original }
    const dirtyKeysRef = { current: { '0': true, '1': true, '2': true } }
    const resets = Object.fromEntries(original.map(key => [
      key,
      vi.fn(() => {
        expect(orderRef.current).toBe(nextOrder)
      }),
    ]))
    commitSortableOrder(
      orderRef,
      nextOrder,
      dirtyKeysRef,
      { current: resets },
      true,
    )
    original.forEach((key, index) => {
      expect(resets[key]).toHaveBeenCalledTimes(index < 3 ? 1 : 0)
    })
    expect(dirtyKeysRef.current).toEqual({})
  })

  it('does not clear the active overlay for a new array with the same order', () => {
    const reset = vi.fn()
    const dirtyKeysRef = { current: { a: true } }
    commitSortableOrder({ current: ['a', 'b'] }, ['a', 'b'], dirtyKeysRef, {
      current: { a: reset },
    }, false)
    expect(reset).not.toHaveBeenCalled()
    expect(dirtyKeysRef.current.a).toBe(true)
  })

  it('cleans a finished drag even when the controlled order was not accepted', () => {
    const reset = vi.fn()
    const dirtyKeysRef = { current: { a: true, removed: true } }
    commitSortableOrder({ current: ['a', 'b'] }, ['a', 'b'], dirtyKeysRef, {
      current: { a: reset },
    }, true)
    expect(reset).toHaveBeenCalledOnce()
    expect(dirtyKeysRef.current).toEqual({})
  })
})

describe('stable draggable handlers', () => {
  it('preserves all 90 handler maps when only background callback identities change', () => {
    const items = Array.from({ length: 90 }, () => setupDraggable())
    const before = items.map(({ render, options }) =>
      render(() => useDraggable(options))
    )
    items.forEach(({ render, options }, index) => {
      options.onDragStart = vi.fn()
      options.onDragging = vi.fn()
      options.onDragEnd = vi.fn()
      const after = render(() => useDraggable(options))
      expect(after.eventHandlers).toBe(before[index].eventHandlers)
      expect(after.utils).toBe(before[index].utils)
      expect(after.setTransform).toBe(before[index].setTransform)
      expect(after.setStyleProperties).toBe(before[index].setStyleProperties)
      expect(after.resetInternalValues).toBe(before[index].resetInternalValues)
      after.eventHandlers['main-thread:bindtouchstart']?.(event())
      after.eventHandlers['main-thread:bindtouchmove']?.(event(10))
      after.eventHandlers['main-thread:bindtouchend']?.(event(10))
      expect(options.onDragging).toHaveBeenCalledWith({ x: 0, y: 10 })
      expect(options.onDragEnd).toHaveBeenCalledWith({ x: 0, y: 10 })
    })
  })

  it('still applies changed bounds and main-thread callbacks', () => {
    const { render, options, setStyleProperty } = setupDraggable()
    const before = render(() =>
      useDraggable({ ...options, maxTranslateY: 100 })
    )
    const onMTSDragging = vi.fn()
    const after = render(() =>
      useDraggable({ ...options, maxTranslateY: 20, onMTSDragging })
    )
    expect(after.eventHandlers).not.toBe(before.eventHandlers)
    expect(after.setTransform).toBe(before.setTransform)
    expect(after.setStyleProperties).toBe(before.setStyleProperties)
    expect(after.resetInternalValues).toBe(before.resetInternalValues)
    after.eventHandlers['main-thread:bindtouchstart']?.(event())
    after.eventHandlers['main-thread:bindtouchmove']?.(event(90))
    expect(setStyleProperty).toHaveBeenCalledWith(
      'transform',
      'translate(0px, 20px)',
    )
    expect(onMTSDragging).toHaveBeenCalledWith({ x: 0, y: 20 }, event(90))
  })

  it('keeps reset independent of the element ref and retains the utils alias', () => {
    const { render, options, setStyleProperty } = setupDraggable()
    const before = render(() => useDraggable(options))
    const replacement = setupDraggable()
    const after = render(() =>
      useDraggable({
        ...options,
        draggableNodeRef: replacement.options.draggableNodeRef,
      })
    )
    expect(after.resetInternalValues).toBe(before.resetInternalValues)
    expect(after.setTransform).not.toBe(before.setTransform)
    expect(after.setStyleProperties).not.toBe(before.setStyleProperties)
    expect(after.utils.setTransform).toBe(after.setTransform)
    expect(after.utils.setStyleProperties).toBe(after.setStyleProperties)
    expect(after.utils.resetInternalValues).toBe(after.resetInternalValues)

    after.setTransform(0, 40)
    expect(replacement.setStyleProperty).toHaveBeenCalledWith(
      'transform',
      'translate(0px, 40px)',
    )
    expect(setStyleProperty).not.toHaveBeenCalled()
    const styles = { opacity: '0.5' }
    after.setStyleProperties(styles)
    expect(replacement.options.draggableNodeRef.current.setStyleProperties)
      .toHaveBeenCalledWith(styles)
    after.resetInternalValues()
    after.eventHandlers['main-thread:bindtouchstart']?.(event())
    after.eventHandlers['main-thread:bindtouchmove']?.(event(10))
    expect(options.onDragging).toHaveBeenLastCalledWith({ x: 0, y: 10 })
  })

  it('disables individual actions along with the legacy utils methods', () => {
    const { render, options, setStyleProperty } = setupDraggable()
    const enabled = render(() => useDraggable(options))
    enabled.setTransform(0, 40)
    setStyleProperty.mockClear()
    const disabled = render(() =>
      useDraggable({ ...options, enableDragging: false })
    )
    expect(disabled.setTransform).toBe(disabled.utils.setTransform)
    expect(disabled.setStyleProperties).toBe(disabled.utils.setStyleProperties)
    expect(disabled.resetInternalValues).toBe(
      disabled.utils.resetInternalValues,
    )
    disabled.setTransform(0, 100)
    disabled.setStyleProperties({ opacity: '0' })
    disabled.resetInternalValues()
    expect(setStyleProperty).not.toHaveBeenCalled()
    expect(options.draggableNodeRef.current.setStyleProperties)
      .not.toHaveBeenCalled()

    const restored = render(() => useDraggable(options))
    expect(restored.setTransform).toBe(enabled.setTransform)
    expect(restored.setStyleProperties).toBe(enabled.setStyleProperties)
    expect(restored.resetInternalValues).toBe(enabled.resetInternalValues)
    restored.eventHandlers['main-thread:bindtouchstart']?.(event())
    restored.eventHandlers['main-thread:bindtouchmove']?.(event(10))
    expect(options.onDragging).toHaveBeenLastCalledWith({ x: 0, y: 50 })
  })

  it('removes and restores bindings when disabled, and supports trigger changes', () => {
    const { render, options } = setupDraggable()
    const update = (config: useDragOptions) =>
      render(() => useDraggable({ ...options, ...config }))
    const enabled = update({})
    const disabled = update({ enableDragging: false })
    expect(disabled.eventHandlers).toEqual({})
    expect(update({ enableDragging: false }).eventHandlers).toBe(
      disabled.eventHandlers,
    )
    expect(
      update({ enableDragging: true })
        .eventHandlers['main-thread:bindtouchstart'],
    )
      .toBe(enabled.eventHandlers['main-thread:bindtouchstart'])
    const longpress = update({ trigger: 'longpress' })
    expect(longpress.eventHandlers['main-thread:bindtouchstart'])
      .toBeUndefined()
    expect(longpress.eventHandlers['main-thread:bindlongpress']).toBeDefined()
  })
})
