// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createRef, useState } from '@lynx-js/react'

import {
  act,
  createEvent,
  fireEvent,
  render,
} from '@lynx-js/react/testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ViewPager } from '../src'
import type { ViewPagerRef } from '../src'

// cspell:ignore willchange

const pages = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
]

function pageEvent(element: Element, name: string, index: number) {
  const event = createEvent(`bindEvent:${name}`, element)
  Object.assign(event, {
    eventType: 'bindEvent',
    eventName: name,
    detail: { index, isDragged: true },
  })
  fireEvent(element, event)
  return event
}

const invoke = vi.fn(() => ({ exec: vi.fn() }))

beforeEach(() => {
  invoke.mockClear()
  const prototype = Object.getPrototypeOf(
    lynx.createSelectorQuery().selectUniqueID(0),
  )
  vi.spyOn(prototype, 'invoke').mockImplementation(invoke)
})

describe('ViewPager', () => {
  it('generates direct native items and merges shared and per-item props', () => {
    const { container } = render(
      <ViewPager
        data={pages}
        getItemKey={page => page.id}
        itemClassName='shared'
        itemStyle={{ width: '90%' }}
        getItemProps={(page, index) => ({
          className: index === 0 ? 'first' : undefined,
          style: { height: `${index + 1}px` },
          itemProps: { 'accessibility-label': `Page ${page.label}` },
        })}
      >
        {page => <text>{page.label}</text>}
      </ViewPager>,
    )
    const pager = container.querySelector('viewpager')!
    expect(pager.children).toHaveLength(3)
    expect(
      Array.from(pager.children).every(
        child => child.tagName.toLowerCase() === 'viewpager-item',
      ),
    ).toBe(true)
    expect(pager.children[0]?.className).toContain('shared')
    expect(pager.children[0]?.className).toContain('first')
    expect(pager.children[0]?.getAttribute('accessibility-label')).toBe(
      'Page A',
    )
    expect(pager.children[0]?.getAttribute('style')).toContain('width: 90%')
    expect(pager.children[0]?.getAttribute('style')).toContain('height: 1px')
  })

  it('uses exposure placeholders without eagerly calling the page renderer', () => {
    const renderPage = vi.fn((page: (typeof pages)[number]) => (
      <text>{page.label}</text>
    ))
    const { container, queryByText } = render(
      <ViewPager
        data={pages}
        getItemKey={page => page.id}
        initialSelectIndex={1}
        lazyOptions={{
          enableLazy: true,
          scene: 'view-pager-test',
          exposureLeft: '40px',
          exposureRight: '50px',
        }}
      >
        {renderPage}
      </ViewPager>,
    )

    expect(renderPage).toHaveBeenCalledTimes(1)
    expect(renderPage).toHaveBeenCalledWith(pages[1], 1)
    expect(queryByText('B')).not.toBeNull()
    expect(queryByText('A')).toBeNull()
    expect(queryByText('C')).toBeNull()
    const placeholders = container.querySelectorAll(
      '[exposure-scene="view-pager-test"]',
    )
    expect(placeholders).toHaveLength(2)
    expect(placeholders[0]?.getAttribute('exposure-screen-margin-left')).toBe(
      '40px',
    )
    expect(placeholders[0]?.getAttribute('exposure-screen-margin-right')).toBe(
      '50px',
    )
    expect(container.querySelector('viewpager')?.getAttribute('keep-item-view'))
      .toBe('true')
  })

  it('does not rerender page content when native swipe events fire', () => {
    const renderPage = vi.fn((page: (typeof pages)[number]) => (
      <text>{page.label}</text>
    ))
    const onPageWillChange = vi.fn()
    const onPageChange = vi.fn()
    const { container } = render(
      <ViewPager
        data={pages}
        getItemKey={page => page.id}
        onPageWillChange={onPageWillChange}
        onPageChange={onPageChange}
      >
        {renderPage}
      </ViewPager>,
    )
    const pager = container.querySelector('viewpager')!
    expect(renderPage).toHaveBeenCalledTimes(3)
    const willChangeEvent = pageEvent(pager, 'willchange', 1)
    const changeEvent = pageEvent(pager, 'change', 1)
    expect(renderPage).toHaveBeenCalledTimes(3)
    expect(onPageWillChange).toHaveBeenCalledWith(willChangeEvent)
    expect(onPageChange).toHaveBeenCalledWith(changeEvent)
    expect(onPageChange.mock.calls[0]?.[0].detail.index).toBe(1)
  })

  it('uses the initial index only on mount', () => {
    const renderPager = (initialSelectIndex: number) => (
      <ViewPager
        data={pages}
        getItemKey={page => page.id}
        initialSelectIndex={initialSelectIndex}
      >
        {page => <text>{page.label}</text>}
      </ViewPager>
    )
    const { container, rerender } = render(renderPager(2))
    expect(
      container.querySelector('viewpager')?.getAttribute(
        'initial-select-index',
      ),
    )
      .toBe('2')
    rerender(renderPager(0))
    expect(
      container.querySelector('viewpager')?.getAttribute(
        'initial-select-index',
      ),
    )
      .toBe('2')
  })

  it('preserves page state through keyed reordering', () => {
    function Counter({ label }: { label: string }) {
      const [count, setCount] = useState(0)
      return (
        <text bindtap={() => setCount(value => value + 1)}>
          {`${label} ${count}`}
        </text>
      )
    }
    const renderPage = (page: (typeof pages)[number]) => (
      <Counter label={page.label} />
    )
    const { getByText, rerender } = render(
      <ViewPager data={pages} getItemKey={page => page.id}>
        {renderPage}
      </ViewPager>,
    )
    fireEvent.tap(getByText('A 0'))
    rerender(
      <ViewPager
        data={[pages[1], pages[0], pages[2]]}
        getItemKey={page => page.id}
      >
        {renderPage}
      </ViewPager>,
    )
    expect(getByText('A 1')).toBeDefined()
  })

  it('clamps native selection requests using the latest data length', () => {
    const ref = createRef<ViewPagerRef>()
    const success = vi.fn()
    const fail = vi.fn()
    const { rerender } = render(
      <ViewPager ref={ref} data={pages} getItemKey={page => page.id}>
        {page => <text>{page.label}</text>}
      </ViewPager>,
    )
    act(() => ref.current?.selectTab(10, false, success, fail))
    expect(invoke).toHaveBeenCalledWith({
      method: 'selectTab',
      params: { index: 2, smooth: false },
      success,
      fail,
    })

    rerender(
      <ViewPager ref={ref} data={[]} getItemKey={page => page.id}>
        {page => <text>{page.label}</text>}
      </ViewPager>,
    )
    act(() => ref.current?.selectTab(1))
    expect(invoke).toHaveBeenCalledTimes(1)
  })
})
