// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createRef } from '@lynx-js/react'
import type { ReactNode } from '@lynx-js/react'

import type { ViewPagerChangeEvent } from '@lynx-js/lynx-ui-view-pager'
import {
  act,
  createEvent,
  fireEvent,
  render,
} from '@lynx-js/react/testing-library'
import { describe, expect, it, vi } from 'vitest'

import { TabsBar } from '../src/TabsBar'
import { TabsPanel } from '../src/TabsPanel'
import { TabsRoot } from '../src/TabsRoot'
import type { TabsData, TabsRootRef } from '../src/types'

vi.mock('@lynx-js/lynx-ui-scroll-view', () => ({
  ScrollView: ({ children }: { children?: ReactNode }) => (
    <scroll-view>{children}</scroll-view>
  ),
}))

vi.mock('@lynx-js/lynx-ui-view-pager', () => ({
  ViewPager: (
    props: { onPageChange?: (event: ViewPagerChangeEvent) => void },
  ) => <viewpager bindchange={props.onPageChange} />,
}))

function createTabs(keys: string[]): TabsData<string>[] {
  return keys.map(tabKey => ({
    getTabKey: () => tabKey,
    tabItem: tabKey,
  }))
}

function firePageChange(element: Element, index: number) {
  const event = createEvent('bindEvent:change', element)
  Object.assign(event, {
    eventType: 'bindEvent',
    eventName: 'change',
    detail: { index, isDragged: true },
  })
  fireEvent(element, event)
}

describe('TabsRoot selection keys', () => {
  it('reports the current stable key after tabs are reordered', () => {
    const onTabChanged = vi.fn()
    const renderTabs = (keys: string[]) => (
      <TabsRoot onTabChanged={onTabChanged}>
        <TabsBar data={createTabs(keys)} />
        <TabsPanel data={keys}>{tabKey => <text>{tabKey}</text>}</TabsPanel>
      </TabsRoot>
    )
    const { container, rerender } = render(
      renderTabs(['home', 'profile']),
    )

    rerender(renderTabs(['profile', 'home']))
    firePageChange(container.querySelector('viewpager')!, 0)

    expect(onTabChanged).toHaveBeenCalledWith(0, 'profile')
  })

  it('uses the current stable key for panel-free imperative selection', () => {
    const onTabChanged = vi.fn()
    const rootRef = createRef<TabsRootRef>()
    const renderTabs = (keys: string[]) => (
      <TabsRoot ref={rootRef} onTabChanged={onTabChanged}>
        <TabsBar data={createTabs(keys)} />
      </TabsRoot>
    )
    const { rerender } = render(renderTabs(['home', 'profile']))

    rerender(renderTabs(['profile', 'home']))
    act(() => rootRef.current?.selectTab(1, false))

    expect(onTabChanged).toHaveBeenCalledWith(1, 'home')
  })

  it('preserves index notifications when no TabsBar is registered', () => {
    const onTabChanged = vi.fn()
    const { container } = render(
      <TabsRoot onTabChanged={onTabChanged}>
        <TabsPanel data={['home', 'profile']}>
          {tabKey => <text>{tabKey}</text>}
        </TabsPanel>
      </TabsRoot>,
    )

    firePageChange(container.querySelector('viewpager')!, 1)

    expect(onTabChanged).toHaveBeenCalledWith(1, undefined)
  })
})
