// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// cspell:ignore willchange

import { createRef, useState } from '@lynx-js/react'

import {
  act,
  createEvent,
  fireEvent,
  render,
} from '@lynx-js/react/testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ViewPager, ViewPagerItem } from '../src'
import type { ViewPagerRef } from '../src'

function pages(prefix = '') {
  return ['A', 'B', 'C'].map(label => (
    <ViewPagerItem key={label}>
      <text>{`${prefix}${label}`}</text>
    </ViewPagerItem>
  ))
}

function pageEvent(
  element: Element,
  name: string,
  index: number,
  isDragged: boolean,
) {
  const event = createEvent(`bindEvent:${name}`, element)
  Object.assign(event, {
    eventType: 'bindEvent',
    eventName: name,
    detail: { index, isDragged },
  })
  fireEvent(element, event)
}

const invoke = vi.fn(() => ({ exec: vi.fn() }))

beforeEach(() => {
  invoke.mockClear()
  // ReactLynx renders real components; only the unimplemented native method is mocked.
  const prototype = Object.getPrototypeOf(
    lynx.createSelectorQuery().selectUniqueID(0),
  )
  vi.spyOn(prototype, 'invoke').mockImplementation(invoke)
})

describe('ViewPager', () => {
  it('renders native item children and forwards item accessibility and styling', () => {
    const { container } = render(
      <ViewPager lazy={false}>
        <ViewPagerItem
          className='custom'
          itemProps={{ 'accessibility-label': 'Page A' }}
        >
          {({ index, selected }) => <text>{`${index}:${selected}`}</text>}
        </ViewPagerItem>
      </ViewPager>,
    )
    const pager = container.querySelector('viewpager')!
    expect(pager.hasAttribute('id')).toBe(false)
    expect(pager.children).toHaveLength(1)
    expect(pager.firstElementChild?.tagName.toLowerCase()).toBe(
      'viewpager-item',
    )
    expect(pager.firstElementChild?.className).toContain('ui-selected')
    expect(pager.firstElementChild?.className).toContain('custom')
    expect(pager.firstElementChild?.getAttribute('accessibility-label')).toBe(
      'Page A',
    )
  })

  it('keeps two lazy pagers independent and honors initialSelectIndex only on mount', () => {
    const ref = createRef<ViewPagerRef>()
    function Pair({ initial }: { initial: number }) {
      return (
        <view>
          <ViewPager ref={ref} initialSelectIndex={initial} preloadCount={0}>
            {pages('first-')}
          </ViewPager>
          <ViewPager preloadCount={0}>{pages('second-')}</ViewPager>
        </view>
      )
    }
    const { queryByText, rerender } = render(<Pair initial={1} />)
    expect(queryByText('first-B')).not.toBeNull()
    expect(queryByText('first-A')).toBeNull()
    expect(queryByText('second-B')).toBeNull()
    act(() => ref.current?.selectTab(2, false))
    expect(queryByText('first-C')).not.toBeNull()
    expect(queryByText('first-B')).not.toBeNull()
    expect(queryByText('second-C')).toBeNull()
    rerender(<Pair initial={0} />)
    expect(queryByText('first-A')).toBeNull()
  })

  it('invokes the native ref and updates selected state only on completion', () => {
    const ref = createRef<ViewPagerRef>()
    const onPageChange = vi.fn()
    const success = vi.fn()
    const fail = vi.fn()
    const { container } = render(
      <ViewPager ref={ref} onPageChange={onPageChange}>{pages()}</ViewPager>,
    )
    act(() => ref.current?.selectTab(2, false, success, fail))
    expect(invoke).toHaveBeenCalledWith({
      method: 'selectTab',
      params: { index: 2, smooth: false },
      success,
      fail,
    })
    const pager = container.querySelector('viewpager')!
    expect(pager.children[0]?.className).toContain('ui-selected')
    pageEvent(pager, 'change', 2, false)
    expect(onPageChange).toHaveBeenCalledTimes(1)
    expect(pager.children[2]?.className).toContain('ui-selected')
  })

  it('loads a swipe destination before completion and reports swipe events', () => {
    const onPageWillChange = vi.fn()
    const onPageChange = vi.fn()
    const { container, queryByText } = render(
      <ViewPager
        preloadCount={0}
        onPageWillChange={onPageWillChange}
        onPageChange={onPageChange}
      >
        {pages()}
      </ViewPager>,
    )
    const pager = container.querySelector('viewpager')!
    expect(queryByText('B')).toBeNull()
    pageEvent(pager, 'willchange', 1, true)
    expect(queryByText('B')).not.toBeNull()
    expect(onPageWillChange).toHaveBeenCalledTimes(1)
    pageEvent(pager, 'change', 1, true)
    expect(onPageChange).toHaveBeenCalledTimes(1)
    expect(pager.children[1]?.className).toContain('ui-selected')
    expect(invoke).not.toHaveBeenCalled()
  })

  it('preserves mounted page state through navigation and keyed reordering', () => {
    function Counter() {
      const [count, setCount] = useState(0)
      return (
        <text bindtap={() => setCount(value => value + 1)}>
          {`Count ${count}`}
        </text>
      )
    }
    const ref = createRef<ViewPagerRef>()
    const a = (
      <ViewPagerItem key='a'>
        <Counter />
      </ViewPagerItem>
    )
    const b = (
      <ViewPagerItem key='b'>
        <text>Other</text>
      </ViewPagerItem>
    )
    const { getByText, rerender } = render(
      <ViewPager ref={ref} preloadCount={0}>{[a, b]}</ViewPager>,
    )
    fireEvent.tap(getByText('Count 0'))
    act(() => ref.current?.selectTab(1, false))
    expect(getByText('Count 1')).toBeDefined()
    rerender(<ViewPager ref={ref} preloadCount={0}>{[b, a]}</ViewPager>)
    expect(getByText('Count 1')).toBeDefined()
  })

  it('clamps selection after removal and ignores empty-pager requests', () => {
    const ref = createRef<ViewPagerRef>()
    const onPageChange = vi.fn()
    const { container, rerender } = render(
      <ViewPager ref={ref} initialSelectIndex={2} onPageChange={onPageChange}>
        {pages()}
      </ViewPager>,
    )
    rerender(
      <ViewPager ref={ref} onPageChange={onPageChange}>
        {pages().slice(0, 1)}
      </ViewPager>,
    )
    expect(container.querySelector('viewpager-item')?.className).toContain(
      'ui-selected',
    )
    rerender(<ViewPager ref={ref} onPageChange={onPageChange} />)
    act(() => ref.current?.selectTab(10))
    expect(onPageChange).not.toHaveBeenCalled()
  })
})
