// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  runOnBackground,
  runOnMainThread,
  useMainThreadRef,
  useRef,
} from '@lynx-js/react'

import type { DraggableRef } from '@lynx-js/lynx-ui-draggable'
import { fireEvent, render, renderHook } from '@lynx-js/react/testing-library'
import type { MainThread } from '@lynx-js/types'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { UseDragOptions } from '../../lynx-ui-draggable/src/types/index.docs'
import { useDraggable } from '../../lynx-ui-draggable/src/useDraggable'
import { commitSortableOrder } from '../src/commitSortableOrder'
import { useSortable } from '../src/useSortable'

const mouseEvent = (y = 0) =>
  ({ button: 0, pageX: 0, pageY: y }) as MainThread.MouseEvent

const row = (key: string, title = key) => ({
  dataItem: { title },
  getSortingKey: () => key,
})

const keys = (data: ReturnType<typeof row>[]) =>
  data.map(item => item.getSortingKey())

interface SortableHarnessProps {
  data: ReturnType<typeof row>[]
  onDragStart: ReturnType<typeof vi.fn>
  onDragEnd: ReturnType<typeof vi.fn>
  debugLog?: boolean
}

function setupSortable(count = 90) {
  const initialData = Array.from(
    { length: count },
    (_, index) => row(String(index)),
  )
  const initialKeys = keys(initialData)
  const initialSizes = Object.fromEntries(initialKeys.map(key => [key, 100]))
  const state: SortableHarnessProps = {
    data: initialData,
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
    debugLog: false,
  }

  let setOrderMT: ((next: string[]) => void) | undefined
  let setDisabledKeyMT: ((key: string, disabled: boolean) => void) | undefined

  const hook = renderHook(
    (props: SortableHarnessProps) => {
      const orderRef = useMainThreadRef<string[]>(initialKeys)
      const sizeMap = useMainThreadRef<Record<string, number>>(initialSizes)
      const itemRefMap = useRef<Record<string, DraggableRef | null>>({})
      const itemMTSRefMap = useMainThreadRef<
        Record<string, DraggableRef | null>
      >({})
      const dirtyKeysRef = useMainThreadRef<Record<string, boolean>>({})
      const disabledKeysRef = useMainThreadRef<Record<string, boolean>>({})

      setOrderMT = (next: string[]) => {
        'main thread'
        orderRef.current = next
      }
      setDisabledKeyMT = (key: string, disabled: boolean) => {
        'main thread'
        disabledKeysRef.current[key] = disabled
      }

      return useSortable({
        data: props.data,
        orderRef,
        sizeMap,
        itemRefMap,
        itemMTSRefMap,
        dirtyKeysRef,
        disabledKeysRef,
        onDragStart: props.onDragStart,
        onDragEnd: props.onDragEnd,
        debugLog: props.debugLog,
      })
    },
    { initialProps: state },
  )

  return {
    state,
    result: hook.result,
    rerender: (next: Partial<SortableHarnessProps> = {}) => {
      Object.assign(state, next)
      hook.rerender({ ...state })
    },
    setOrder: (next: string[]) => runOnMainThread(setOrderMT!)(next),
    setDisabledKey: (key: string, disabled: boolean) =>
      runOnMainThread(setDisabledKeyMT!)(key, disabled),
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('stable sortable actions', () => {
  it('refreshes captured debug flags only when the flag changes', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() =>
      undefined
    )
    const { result, rerender } = setupSortable(3)
    const disabled = result.current!
    rerender({ debugLog: false })
    expect(result.current!.handleDragMove).toBe(disabled.handleDragMove)

    for (const debugLog of [true, false]) {
      rerender({ debugLog })
      const actions = result.current!
      rerender({ debugLog })
      expect(result.current!.handleDragStart).toBe(actions.handleDragStart)
      expect(result.current!.handleDragMove).toBe(actions.handleDragMove)
      expect(result.current!.handleDragEnd).toBe(actions.handleDragEnd)

      infoSpy.mockClear()
      await runOnMainThread(actions.handleDragMove)(
        { x: 0, y: 0 },
        'missing',
        mouseEvent(),
      )
      await runOnMainThread(actions.handleDragStart)(
        { x: 0, y: 0 },
        '0',
        mouseEvent(),
      )
      await runOnMainThread(actions.handleDragMove)(
        { x: 0, y: 180 },
        '0',
        mouseEvent(180),
      )
      await runOnMainThread(actions.handleDragEnd)('0', mouseEvent(180))
      expect(infoSpy.mock.calls.length > 0).toBe(debugLog)
    }
  })

  it('preserves all actions after a three-position change in a 90-item list', async () => {
    const { state, result, rerender, setOrder } = setupSortable()
    const before = result.current!
    const nextData = [
      state.data[1],
      state.data[2],
      state.data[0],
      ...state.data.slice(3),
    ]
    const nextDragStart = vi.fn()
    const nextDragEnd = vi.fn()
    rerender({
      data: nextData,
      onDragStart: nextDragStart,
      onDragEnd: nextDragEnd,
    })
    await setOrder(keys(nextData))

    const after = result.current!
    expect(after.handleDragStart).toBe(before.handleDragStart)
    expect(after.handleDragMove).toBe(before.handleDragMove)
    expect(after.handleDragEnd).toBe(before.handleDragEnd)

    await runOnMainThread(before.handleDragStart)(
      { x: 0, y: 0 },
      '0',
      mouseEvent(),
    )
    expect(nextDragStart).toHaveBeenCalledWith('0')
  })

  it('uses the newly committed order on consecutive drags', async () => {
    const { state, result, rerender, setOrder } = setupSortable(5)
    const actions = result.current!
    await runOnMainThread(actions.handleDragStart)(
      { x: 0, y: 0 },
      '0',
      mouseEvent(),
    )
    await runOnMainThread(actions.handleDragMove)(
      { x: 0, y: 180 },
      '0',
      mouseEvent(180),
    )
    await expect(
      runOnMainThread(actions.handleDragEnd)('0', mouseEvent(180)),
    ).resolves.toBe(true)

    const reordered = state.onDragEnd.mock.calls[0]![0] as ReturnType<
      typeof row
    >[]
    expect(keys(reordered)).toEqual(['1', '2', '0', '3', '4'])
    rerender({ data: reordered })
    await setOrder(keys(reordered))

    await runOnMainThread(actions.handleDragStart)(
      { x: 0, y: 0 },
      '0',
      mouseEvent(),
    )
    await runOnMainThread(actions.handleDragMove)(
      { x: 0, y: -180 },
      '0',
      mouseEvent(-180),
    )
    await expect(
      runOnMainThread(actions.handleDragEnd)('0', mouseEvent(-180)),
    ).resolves.toBe(true)
    expect(
      keys(state.onDragEnd.mock.calls[1]![0] as ReturnType<typeof row>[]),
    ).toEqual(['0', '1', '2', '3', '4'])
  })

  it('reads current business data and callbacks without changing actions', async () => {
    const { state, result, rerender } = setupSortable(3)
    const actions = result.current!
    const oldCallback = state.onDragEnd
    const updatedData = state.data.map(item =>
      row(item.getSortingKey(), 'updated')
    )
    const nextCallback = vi.fn()
    rerender({ data: updatedData, onDragEnd: nextCallback })

    await runOnMainThread(actions.handleDragStart)(
      { x: 0, y: 0 },
      '0',
      mouseEvent(),
    )
    await expect(
      runOnMainThread(actions.handleDragEnd)('0', mouseEvent()),
    ).resolves.toBe(false)
    expect(oldCallback).not.toHaveBeenCalled()
    expect(nextCallback).toHaveBeenCalledWith(updatedData)
  })

  it('keeps disabled positions locked and reads disabled changes through the ref', async () => {
    const { state, result, setDisabledKey } = setupSortable(5)
    const actions = result.current!
    await setDisabledKey('1', true)
    await runOnMainThread(actions.handleDragStart)(
      { x: 0, y: 0 },
      '0',
      mouseEvent(),
    )
    await runOnMainThread(actions.handleDragMove)(
      { x: 0, y: 280 },
      '0',
      mouseEvent(280),
    )
    await runOnMainThread(actions.handleDragEnd)('0', mouseEvent(280))
    expect(
      keys(state.onDragEnd.mock.calls[0]![0] as ReturnType<typeof row>[]),
    ).toEqual(['2', '1', '3', '0', '4'])
  })

  it('does not retain a confirmed swap into the next stationary gesture', async () => {
    const { state, result, rerender, setOrder } = setupSortable(5)
    const actions = result.current!
    await runOnMainThread(actions.handleDragStart)(
      { x: 0, y: 0 },
      '0',
      mouseEvent(),
    )
    await runOnMainThread(actions.handleDragMove)(
      { x: 0, y: 180 },
      '0',
      mouseEvent(180),
    )
    await runOnMainThread(actions.handleDragEnd)('0', mouseEvent(180))

    const reordered = state.onDragEnd.mock.calls[0]![0] as ReturnType<
      typeof row
    >[]
    rerender({ data: reordered })
    await setOrder(keys(reordered))

    await runOnMainThread(actions.handleDragStart)(
      { x: 0, y: 0 },
      '0',
      mouseEvent(),
    )
    await expect(
      runOnMainThread(actions.handleDragEnd)('0', mouseEvent()),
    ).resolves.toBe(false)
    expect(state.onDragEnd.mock.calls[1]![0]).toEqual(reordered)
  })
})

describe('committing order and visual cleanup', () => {
  it('updates order before resetting only the three dirty items out of 90', async () => {
    render(<view />)
    const original = Array.from({ length: 90 }, (_, index) => String(index))
    const nextOrder = ['1', '2', '0', ...original.slice(3)]
    const result = await runOnMainThread(() => {
      'main thread'
      const orderRef = { current: original }
      const dirtyKeysRef: { current: Record<string, boolean> } = {
        current: { '0': true, '1': true, '2': true },
      }
      const counts: Record<string, number> = {}
      const orderMatched: boolean[] = []
      const resets: Record<string, () => void> = {}
      for (const key of original) {
        counts[key] = 0
        resets[key] = () => {
          counts[key] += 1
          orderMatched.push(orderRef.current === nextOrder)
        }
      }
      commitSortableOrder(
        orderRef,
        nextOrder,
        dirtyKeysRef,
        { current: resets },
        true,
      )
      return {
        counts,
        orderMatched,
        dirtyKeys: dirtyKeysRef.current,
      }
    })()

    original.forEach((key, index) => {
      expect(result.counts[key]).toBe(index < 3 ? 1 : 0)
    })
    expect(result.orderMatched).toEqual([true, true, true])
    expect(result.dirtyKeys).toEqual({})
  })

  it('does not clear the active overlay for a new array with the same order', async () => {
    render(<view />)
    const result = await runOnMainThread(() => {
      'main thread'
      let resetCalls = 0
      const dirtyKeysRef: { current: Record<string, boolean> } = {
        current: { a: true },
      }
      commitSortableOrder(
        { current: ['a', 'b'] },
        ['a', 'b'],
        dirtyKeysRef,
        {
          current: {
            a: () => {
              resetCalls += 1
            },
          },
        },
        false,
      )
      return { resetCalls, dirtyKeys: dirtyKeysRef.current }
    })()

    expect(result.resetCalls).toBe(0)
    expect(result.dirtyKeys.a).toBe(true)
  })

  it('cleans a finished drag even when the controlled order was not accepted', async () => {
    render(<view />)
    const result = await runOnMainThread(() => {
      'main thread'
      let resetCalls = 0
      const dirtyKeysRef: { current: Record<string, boolean> } = {
        current: { a: true, removed: true },
      }
      commitSortableOrder(
        { current: ['a', 'b'] },
        ['a', 'b'],
        dirtyKeysRef,
        {
          current: {
            a: () => {
              resetCalls += 1
            },
          },
        },
        true,
      )
      return { resetCalls, dirtyKeys: dirtyKeysRef.current }
    })()

    expect(result.resetCalls).toBe(1)
    expect(result.dirtyKeys).toEqual({})
  })
})

interface DraggableHarnessProps {
  options: UseDragOptions
  useAlternateNode?: boolean
  onCapture: (value: ReturnType<typeof useDraggable>) => void
}

function DraggableHarness({
  options,
  useAlternateNode = false,
  onCapture,
}: DraggableHarnessProps) {
  const primaryRef = useMainThreadRef<MainThread.Element | null>(null)
  const alternateRef = useMainThreadRef<MainThread.Element | null>(null)
  const draggable = useDraggable({
    trigger: 'immediate',
    ...options,
    draggableNodeRef: useAlternateNode ? alternateRef : primaryRef,
  })
  onCapture(draggable)
  return (
    <view>
      <view
        id='primary-node'
        main-thread:ref={primaryRef}
        {...draggable.eventHandlers}
      />
      <view id='alternate-node' main-thread:ref={alternateRef} />
    </view>
  )
}

function setupDraggable(initialOptions: UseDragOptions = {}) {
  let latest!: ReturnType<typeof useDraggable>
  const state = {
    onDragStart: vi.fn(),
    onDragging: vi.fn(),
    onDragEnd: vi.fn(),
    ...initialOptions,
  }
  const rendered = render(
    <DraggableHarness
      options={state}
      onCapture={value => {
        latest = value
      }}
    />,
  )
  const getPrimaryNode = () =>
    rendered.container.querySelector('#primary-node') as HTMLElement
  const getAlternateNode = () =>
    rendered.container.querySelector('#alternate-node') as HTMLElement

  return {
    state,
    get current() {
      return latest
    },
    getPrimaryNode,
    getAlternateNode,
    rerender: (
      next: Partial<UseDragOptions> = {},
      useAlternateNode = false,
    ) => {
      Object.assign(state, next)
      rendered.rerender(
        <DraggableHarness
          options={{ ...state }}
          useAlternateNode={useAlternateNode}
          onCapture={value => {
            latest = value
          }}
        />,
      )
    },
  }
}

describe('stable draggable handlers', () => {
  it('preserves all 90 handler maps when only background callback identities change', () => {
    const captured: ReturnType<typeof useDraggable>[] = []
    const callbacks = Array.from({ length: 90 }, () => ({
      onDragStart: vi.fn(),
      onDragging: vi.fn(),
      onDragEnd: vi.fn(),
    }))

    function Item({
      index,
      itemCallbacks,
    }: {
      index: number
      itemCallbacks: (typeof callbacks)[number]
    }) {
      const nodeRef = useMainThreadRef<MainThread.Element | null>(null)
      const draggable = useDraggable({
        draggableNodeRef: nodeRef,
        trigger: 'immediate',
        ...itemCallbacks,
      })
      captured[index] = draggable
      return (
        <view
          id={`item-${index}`}
          main-thread:ref={nodeRef}
          {...draggable.eventHandlers}
        />
      )
    }

    const renderItems = (list: typeof callbacks) => (
      <view>
        {list.map((itemCallbacks, index) => (
          <Item key={index} index={index} itemCallbacks={itemCallbacks} />
        ))}
      </view>
    )

    const { container, rerender } = render(renderItems(callbacks))
    const before = [...captured]

    const nextCallbacks = callbacks.map(() => ({
      onDragStart: vi.fn(),
      onDragging: vi.fn(),
      onDragEnd: vi.fn(),
    }))
    rerender(renderItems(nextCallbacks))

    nextCallbacks.forEach((itemCallbacks, index) => {
      const after = captured[index]!
      expect(after.eventHandlers).toBe(before[index]!.eventHandlers)
      expect(after.utils).toBe(before[index]!.utils)
      expect(after.setTransform).toBe(before[index]!.setTransform)
      expect(after.setStyleProperties).toBe(before[index]!.setStyleProperties)
      expect(after.resetInternalValues).toBe(before[index]!.resetInternalValues)

      const node = container.querySelector(`#item-${index}`)!
      fireEvent.touchstart(node, { button: 0, pageX: 0, pageY: 0 })
      fireEvent.touchmove(node, { button: 0, pageX: 0, pageY: 10 })
      fireEvent.touchend(node, { button: 0, pageX: 0, pageY: 10 })
      expect(itemCallbacks.onDragging).toHaveBeenCalledWith({ x: 0, y: 10 })
      expect(itemCallbacks.onDragEnd).toHaveBeenCalledWith({ x: 0, y: 10 })
    })
  })

  it('still applies changed bounds and main-thread callbacks', () => {
    const draggable = setupDraggable({ maxTranslateY: 100 })
    const before = draggable.current
    const mtsDraggingSpy = vi.fn()
    const onMTSDragging = (
      translate: { x: number, y: number },
      event: MainThread.TouchEvent | MainThread.MouseEvent,
    ) => {
      'main thread'
      runOnBackground(mtsDraggingSpy)(
        translate,
        (event as MainThread.MouseEvent).pageY,
      )
    }

    draggable.rerender({ maxTranslateY: 20, onMTSDragging })
    const after = draggable.current
    expect(after.eventHandlers).not.toBe(before.eventHandlers)
    expect(after.setTransform).toBe(before.setTransform)
    expect(after.setStyleProperties).toBe(before.setStyleProperties)
    expect(after.resetInternalValues).toBe(before.resetInternalValues)

    const node = draggable.getPrimaryNode()
    fireEvent.touchstart(node, { button: 0, pageX: 0, pageY: 0 })
    fireEvent.touchmove(node, { button: 0, pageX: 0, pageY: 90 })
    expect(node.style.transform).toBe('translate(0px, 20px)')
    expect(mtsDraggingSpy).toHaveBeenCalledWith({ x: 0, y: 20 }, 90)
  })

  it('keeps reset independent of the element ref and retains the utils alias', async () => {
    const draggable = setupDraggable()
    const before = draggable.current
    draggable.rerender({}, true)
    const after = draggable.current

    expect(after.resetInternalValues).toBe(before.resetInternalValues)
    expect(after.setTransform).not.toBe(before.setTransform)
    expect(after.setStyleProperties).not.toBe(before.setStyleProperties)
    expect(after.utils.setTransform).toBe(after.setTransform)
    expect(after.utils.setStyleProperties).toBe(after.setStyleProperties)
    expect(after.utils.resetInternalValues).toBe(after.resetInternalValues)

    await runOnMainThread(after.setTransform)(0, 40)
    expect(draggable.getAlternateNode().style.transform).toBe(
      'translate(0px, 40px)',
    )
    expect(draggable.getPrimaryNode().style.transform).toBe('')

    await runOnMainThread(after.setStyleProperties)({ opacity: '0.5' })
    expect(draggable.getAlternateNode().style.opacity).toBe('0.5')

    await runOnMainThread(after.resetInternalValues)()
    const node = draggable.getPrimaryNode()
    fireEvent.touchstart(node, { button: 0, pageX: 0, pageY: 0 })
    fireEvent.touchmove(node, { button: 0, pageX: 0, pageY: 10 })
    expect(draggable.state.onDragging).toHaveBeenLastCalledWith({ x: 0, y: 10 })
  })

  it('disables individual actions along with the legacy utils methods', async () => {
    const draggable = setupDraggable()
    const enabled = draggable.current
    await runOnMainThread(enabled.setTransform)(0, 40)
    expect(draggable.getPrimaryNode().style.transform).toBe(
      'translate(0px, 40px)',
    )

    draggable.rerender({ enableDragging: false })
    const disabled = draggable.current
    expect(disabled.setTransform).toBe(disabled.utils.setTransform)
    expect(disabled.setStyleProperties).toBe(disabled.utils.setStyleProperties)
    expect(disabled.resetInternalValues).toBe(
      disabled.utils.resetInternalValues,
    )
    await runOnMainThread(disabled.setTransform)(0, 100)
    await runOnMainThread(disabled.setStyleProperties)({ opacity: '0' })
    await runOnMainThread(disabled.resetInternalValues)()
    expect(draggable.getPrimaryNode().style.transform).toBe(
      'translate(0px, 40px)',
    )
    expect(draggable.getPrimaryNode().style.opacity).toBe('')

    draggable.rerender({ enableDragging: true })
    const restored = draggable.current
    expect(restored.setTransform).toBe(enabled.setTransform)
    expect(restored.setStyleProperties).toBe(enabled.setStyleProperties)
    expect(restored.resetInternalValues).toBe(enabled.resetInternalValues)

    const node = draggable.getPrimaryNode()
    fireEvent.touchstart(node, { button: 0, pageX: 0, pageY: 0 })
    fireEvent.touchmove(node, { button: 0, pageX: 0, pageY: 10 })
    expect(draggable.state.onDragging).toHaveBeenLastCalledWith({ x: 0, y: 50 })
  })

  it('removes and restores bindings when disabled, and supports trigger changes', () => {
    const draggable = setupDraggable()
    const enabled = draggable.current

    draggable.rerender({ enableDragging: false })
    const disabled = draggable.current
    expect(disabled.eventHandlers).toEqual({})

    draggable.rerender({ enableDragging: false })
    expect(draggable.current.eventHandlers).toBe(disabled.eventHandlers)

    draggable.rerender({ enableDragging: true })
    expect(draggable.current.eventHandlers['main-thread:bindtouchstart']).toBe(
      enabled.eventHandlers['main-thread:bindtouchstart'],
    )

    draggable.rerender({ trigger: 'longpress' })
    expect(draggable.current.eventHandlers['main-thread:bindtouchstart'])
      .toBeUndefined()
    expect(draggable.current.eventHandlers['main-thread:bindlongpress'])
      .toBeDefined()
  })
})
