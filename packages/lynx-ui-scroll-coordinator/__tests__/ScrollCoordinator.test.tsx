// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createRef } from '@lynx-js/react'

import {
  act,
  createEvent,
  fireEvent,
  render,
} from '@lynx-js/react/testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// cspell:ignore headeroffset headerreleased refreshstatechange layoutchange

import { ScrollCoordinator } from '../src'
import type { ScrollCoordinatorRef } from '../src'

interface NativeInvocation {
  method: string
  params?: Record<string, unknown>
  success?: (result: unknown) => void
  fail?: (result: unknown) => void
}

const invoke = vi.fn((_options: NativeInvocation) => ({ exec: vi.fn() }))

beforeEach(() => {
  invoke.mockClear()
  const prototype = Object.getPrototypeOf(
    lynx.createSelectorQuery().selectUniqueID(0),
  )
  vi.spyOn(prototype, 'invoke').mockImplementation(invoke)
})

function nativeEvent(element: Element, name: string, detail: object) {
  const event = createEvent(`bindEvent:${name}`, element)
  Object.assign(event, { eventType: 'bindEvent', eventName: name, detail })
  fireEvent(
    lynx.createSelectorQuery().select(element.tagName.toLowerCase()),
    event,
  )
}

describe('ScrollCoordinator', () => {
  it('renders the public native structure and forwards layout and native props', () => {
    const { container } = render(
      <view>
        <ScrollCoordinator
          id='collection'
          className='custom'
          style={{ height: '400px' }}
          coordinatorProps={{ 'accessibility-label': 'Collection' }}
          headers={<text>Cover</text>}
          toolbar={<text>Toolbar</text>}
          slot={
            <view>
              <text>Content</text>
            </view>
          }
          enableScroll={false}
          bounces
          scrollBarEnable
          headerOverSlot
          scrollWithNative
        />
      </view>,
    )
    const node = container.querySelector('scroll-coordinator')!
    expect(node.querySelector('scroll-coordinator-toolbar')?.textContent).toBe(
      'Toolbar',
    )
    expect(node.querySelector('scroll-coordinator-header')?.textContent).toBe(
      'Cover',
    )
    expect(node.querySelector('scroll-coordinator-slot')?.textContent).toBe(
      'Content',
    )
    expect(container.querySelector('scroll-coordinator')!.className).toContain(
      'custom',
    )
    expect(node.getAttribute('style')).toContain('height: 400px')
    expect(node.getAttribute('accessibility-label')).toBe('Collection')
    expect(node.getAttribute('enable-scroll')).toBe('false')
    expect(node.getAttribute('bounces')).toBe('true')
    expect(node.getAttribute('enable-scroll-bar')).toBe('true')
    expect(node.getAttribute('header-over-slot')).toBe('true')
    expect(node.getAttribute('android-nested-scroll-as-child')).toBe('true')
    expect(node.getAttribute('refresh-mode')).toBe('none')
  })

  it('reports sticky transitions once even when offset events arrive in one batch', async () => {
    const onSticky = vi.fn()
    const onLeaveSticky = vi.fn()
    const onOffsetChange = vi.fn()
    const { container } = render(
      <ScrollCoordinator
        onSticky={onSticky}
        onLeaveSticky={onLeaveSticky}
        onOffsetChange={onOffsetChange}
      />,
    )
    await act(() => {
      nativeEvent(container.querySelector('scroll-coordinator')!, 'offset', {
        offset: 0,
        height: 0,
      })
      nativeEvent(container.querySelector('scroll-coordinator')!, 'offset', {
        offset: 199,
        height: 200,
      })
      nativeEvent(container.querySelector('scroll-coordinator')!, 'offset', {
        offset: 200,
        height: 200,
      })
    })
    expect(onSticky).toHaveBeenCalledTimes(1)
    expect(onLeaveSticky).not.toHaveBeenCalled()
    expect(container.querySelector('scroll-coordinator')!.className).toContain(
      'ui-sticky',
    )
    await act(() => {
      nativeEvent(container.querySelector('scroll-coordinator')!, 'offset', {
        offset: 150,
        height: 200,
      })
      nativeEvent(container.querySelector('scroll-coordinator')!, 'offset', {
        offset: 100,
        height: 200,
      })
    })
    expect(onLeaveSticky).toHaveBeenCalledTimes(1)
    expect(container.querySelector('scroll-coordinator')!.className).not
      .toContain('ui-sticky')
    expect(onOffsetChange).toHaveBeenLastCalledWith({
      offset: 100,
      height: 200,
    })
  })

  it('selects page refresh mode and gives an outer refresh precedence', () => {
    const { container, rerender } = render(<ScrollCoordinator refreshInSlot />)
    expect(
      container.querySelector('scroll-coordinator')?.getAttribute(
        'refresh-mode',
      ),
    ).toBe('page')
    rerender(
      <ScrollCoordinator
        className='sized'
        style={{ height: '360px' }}
        refreshInSlot
        refreshOptions={{
          enableRefresh: true,
          headerContent: <text>Refresh</text>,
        }}
      />,
    )
    const refresh = container.querySelector('refresh')!
    expect(refresh.className).toContain('sized')
    expect(refresh.getAttribute('style')).toContain('height: 360px')
    expect(refresh.firstElementChild?.tagName.toLowerCase()).toBe(
      'refresh-header',
    )
    expect(
      container.querySelector('scroll-coordinator')?.getAttribute(
        'refresh-mode',
      ),
    ).toBe('fold')
    expect(container.querySelector('scroll-coordinator')?.className).not
      .toContain('sized')
  })

  it('reports FeedList-compatible refresh payloads using the measured header height', () => {
    const onStartRefresh = vi.fn()
    const onRefreshOffsetChange = vi.fn()
    const onRefreshStateChange = vi.fn()
    const onHeaderReleased = vi.fn()
    const { container } = render(
      <ScrollCoordinator
        refreshOptions={{
          enableRefresh: true,
          headerContent: <text>Refresh</text>,
          onStartRefresh,
          onRefreshOffsetChange,
          onRefreshStateChange,
          onHeaderReleased,
        }}
      />,
    )
    const refresh = container.querySelector('refresh')!
    const header = container.querySelector('refresh-header')!
    nativeEvent(refresh, 'headeroffset', {
      isDragging: true,
      offsetPercent: 0.5,
    })
    expect(onRefreshOffsetChange).toHaveBeenLastCalledWith({
      offset: 0,
      headerSize: 0,
      isDragging: true,
    })
    nativeEvent(header, 'layoutchange', { height: 64 })
    nativeEvent(refresh, 'headeroffset', {
      isDragging: true,
      offsetPercent: 1.25,
    })
    expect(onRefreshOffsetChange).toHaveBeenLastCalledWith({
      offset: 80,
      headerSize: 64,
      isDragging: true,
    })
    nativeEvent(refresh, 'headerreleased', {})
    expect(onHeaderReleased).toHaveBeenLastCalledWith({
      offset: 80,
      headerSize: 64,
    })
    nativeEvent(header, 'layoutchange', { height: 80 })
    nativeEvent(refresh, 'headeroffset', {
      isDragging: false,
      offsetPercent: 0.5,
    })
    expect(onRefreshOffsetChange).toHaveBeenLastCalledWith({
      offset: 40,
      headerSize: 80,
      isDragging: false,
    })
    nativeEvent(refresh, 'headerreleased', {})
    expect(onHeaderReleased).toHaveBeenLastCalledWith({
      offset: 40,
      headerSize: 80,
    })
    nativeEvent(refresh, 'startrefresh', { isManual: true })
    nativeEvent(refresh, 'startrefresh', { isManual: false })
    expect(onStartRefresh.mock.calls).toEqual([
      [{ triggeredBy: 'drag' }],
      [{ triggeredBy: 'startRefresh' }],
    ])
    for (const state of [1, 2, 0]) {
      nativeEvent(refresh, 'refreshstatechange', { state })
    }
    expect(onRefreshStateChange.mock.calls).toEqual([
      [{ state: 1 }],
      [{ state: 2 }],
      [{ state: 0 }],
    ])
    expect(invoke).not.toHaveBeenCalled()
  })

  it('starts and finishes only the owning refresh instance', () => {
    const first = createRef<ScrollCoordinatorRef>()
    const second = createRef<ScrollCoordinatorRef>()
    const withoutRefresh = createRef<ScrollCoordinatorRef>()
    render(
      <view>
        <ScrollCoordinator
          ref={first}
          refreshOptions={{
            enableRefresh: true,
            headerContent: <text>First</text>,
          }}
        />
        <ScrollCoordinator
          ref={second}
          refreshOptions={{
            enableRefresh: true,
            headerContent: <text>Second</text>,
          }}
        />
        <ScrollCoordinator ref={withoutRefresh} />
      </view>,
    )
    first.current?.startRefresh()
    second.current?.startRefresh()
    first.current?.finishRefresh()
    second.current?.finishRefresh()
    withoutRefresh.current?.startRefresh()
    withoutRefresh.current?.finishRefresh()
    expect(invoke.mock.calls.map(([options]) => options.method)).toEqual([
      'autoStartRefresh',
      'autoStartRefresh',
      'finishRefresh',
      'finishRefresh',
    ])
    expect(invoke.mock.contexts[0]).not.toEqual(invoke.mock.contexts[1])
    expect(invoke.mock.contexts[0]).toEqual(invoke.mock.contexts[2])
    expect(invoke.mock.contexts[1]).toEqual(invoke.mock.contexts[3])
  })

  it('preserves mounted content when disabled and still lets an active refresh finish', () => {
    const ref = createRef<ScrollCoordinatorRef>()
    const onStartRefresh = vi.fn()
    const renderCoordinator = (enableRefresh: boolean) => (
      <ScrollCoordinator
        ref={ref}
        refreshInSlot
        refreshOptions={{
          enableRefresh,
          headerContent: <text>Refresh</text>,
          onStartRefresh,
        }}
        slot={<view id='page-content' />}
      />
    )
    const { container, rerender } = render(renderCoordinator(true))
    const refresh = container.querySelector('refresh')!
    const content = container.querySelector('#page-content')
    ref.current?.startRefresh()
    rerender(renderCoordinator(false))
    expect(container.querySelector('refresh')).toBe(refresh)
    expect(container.querySelector('#page-content')).toBe(content)
    expect(refresh.getAttribute('enable-refresh')).toBe('false')
    expect(
      container.querySelector('scroll-coordinator')?.getAttribute(
        'refresh-mode',
      ),
    ).toBe('page')
    ref.current?.startRefresh()
    nativeEvent(refresh, 'startrefresh', { isManual: true })
    expect(onStartRefresh).not.toHaveBeenCalled()
    ref.current?.finishRefresh()
    expect(invoke.mock.calls.map(([options]) => options.method)).toEqual([
      'autoStartRefresh',
      'finishRefresh',
    ])
    rerender(renderCoordinator(true))
    ref.current?.startRefresh()
    expect(invoke).toHaveBeenLastCalledWith({ method: 'autoStartRefresh' })
  })

  it('routes header commands through the owning native ref and forwards completion callbacks', () => {
    const first = createRef<ScrollCoordinatorRef>()
    const second = createRef<ScrollCoordinatorRef>()
    render(
      <view>
        <ScrollCoordinator ref={first} />
        <ScrollCoordinator ref={second} />
      </view>,
    )
    const success = vi.fn()
    const fail = vi.fn()
    first.current?.scrollTo('120rpx', true, success, fail)
    expect(invoke).toHaveBeenLastCalledWith({
      method: 'setFoldExpanded',
      params: { offset: '120rpx', smooth: true },
      success,
      fail,
    })
    second.current?.scrollToTop(false)
    expect(invoke.mock.contexts[0]).not.toEqual(invoke.mock.contexts[1])
    expect(invoke).toHaveBeenLastCalledWith(
      expect.objectContaining({ params: { offset: '0px', smooth: false } }),
    )
    first.current?.scrollToSticky(true)
    expect(invoke).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'setFoldExpanded',
        params: { offset: '99999999px', smooth: true },
      }),
    )
    expect(invoke.mock.contexts[0]).toEqual(invoke.mock.contexts[2])
  })

  it('measures header targets relative to the owning header and forwards measurement failures', async () => {
    const ref = createRef<ScrollCoordinatorRef>()
    render(
      <ScrollCoordinator
        ref={ref}
        headers={<text id='chapter'>Chapter</text>}
      />,
    )
    invoke.mockImplementationOnce(options => {
      options.success?.({ top: 230 })
      return { exec: vi.fn() }
    }).mockImplementationOnce(options => {
      options.success?.({ top: 80 })
      return { exec: vi.fn() }
    })
    ref.current?.scrollIntoView('chapter', false)
    await vi.waitFor(() => {
      expect(invoke).toHaveBeenLastCalledWith(expect.objectContaining({
        method: 'setFoldExpanded',
        params: { offset: '150px', smooth: false },
      }))
    })
    invoke.mockClear()
    invoke.mockImplementationOnce(options => {
      options.fail?.({ code: 2, data: { message: 'missing target' } })
      return { exec: vi.fn() }
    }).mockImplementationOnce(options => {
      options.success?.({ top: 80 })
      return { exec: vi.fn() }
    })
    const fail = vi.fn()
    ref.current?.scrollIntoView('chapter', true, undefined, fail)
    await vi.waitFor(() => expect(fail).toHaveBeenCalledTimes(1))
    expect(invoke).toHaveBeenCalledTimes(2)
  })

  it('disables bounce for native half-to-full-screen popup integration', () => {
    const { container } = render(
      <ScrollCoordinator
        refreshOptions={{
          enableRefresh: true,
          headerContent: <text>Refresh</text>,
        }}
        popupOptions={{ name: 'panel', enableHalfToFullScreen: true }}
      />,
    )
    const node = container.querySelector('scroll-coordinator')!
    expect(node.getAttribute('bounces')).toBe('false')
    expect(node.getAttribute('compat-container-popup')).toBe('true')
    expect(node.getAttribute('name')).toBe('panel')
  })
})
