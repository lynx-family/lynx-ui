// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ViewPagerChangeEvent } from '@lynx-js/lynx-ui-view-pager'
import { createEvent, fireEvent, render } from '@lynx-js/react/testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TabsPanel } from '../src/TabsPanel'

const mocks = vi.hoisted(() => {
  return {
    notifyTabChanged: vi.fn(),
  }
})

vi.mock('../src/TabsContext', async () => {
  const { useMotionValueRef } = await import('@lynx-js/motion/mini')
  return {
    useTabsRootContext: () => ({
      debugLog: false,
      initialSelectIndex: 0,
      hasPanelMT: useMotionValueRef(false),
      indicatorOffsetMT: useMotionValueRef(0),
      panelIndexMT: useMotionValueRef(0),
      selectTarget: useMotionValueRef({ index: 0, smooth: false }),
      notifyTabChanged: mocks.notifyTabChanged,
    }),
  }
})

vi.mock('@lynx-js/lynx-ui-view-pager', () => ({
  ViewPager: (
    props: { onPageChange?: (event: ViewPagerChangeEvent) => void },
  ) => <viewpager bindchange={props.onPageChange} />,
}))

beforeEach(() => {
  mocks.notifyTabChanged.mockClear()
})

describe('TabsPanel selection keys', () => {
  it('reports the settled page index to the root key registry', () => {
    const onPageChange = vi.fn()
    const { container } = render(
      <TabsPanel data={['page']} onPageChange={onPageChange}>
        {page => <text>{page}</text>}
      </TabsPanel>,
    )
    const viewPager = container.querySelector('viewpager')!
    const event = createEvent('bindEvent:change', viewPager)
    Object.assign(event, {
      eventType: 'bindEvent',
      eventName: 'change',
      detail: { index: 2, isDragged: true },
    })

    fireEvent(viewPager, event)

    expect(onPageChange).toHaveBeenCalledWith(event)
    expect(mocks.notifyTabChanged).toHaveBeenCalledWith(2)
  })
})
