// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  forwardRef,
  memo,
  runOnBackground,
  runOnMainThread,
  useEffect,
  useImperativeHandle,
  useRef,
} from '@lynx-js/react'
import type { ForwardedRef, ReactElement } from '@lynx-js/react'

import { log, mtsLog } from '@lynx-js/lynx-ui-common'
import { ViewPager } from '@lynx-js/lynx-ui-view-pager'
import type {
  ViewPagerChangeEvent,
  ViewPagerOffsetChangeEvent,
  ViewPagerRef,
  ViewPagerWillChangeEvent,
} from '@lynx-js/lynx-ui-view-pager'
import { useMotionValueRefEvent } from '@lynx-js/motion/mini'

import { useTabsRootContext } from './TabsContext'
import type { TabsPanelProps, TabsPanelRef } from './types'

type TabsPanelComponent = <T>(
  props: TabsPanelProps<T> & { ref?: ForwardedRef<TabsPanelRef> },
) => ReactElement

export const TabsPanel = memo(forwardRef(TabsPanelImpl)) as TabsPanelComponent

function TabsPanelImpl<T>(
  props: TabsPanelProps<T>,
  ref: ForwardedRef<TabsPanelRef>,
) {
  const {
    debugLog,
    initialSelectIndex,
    hasPanelMT,
    indicatorOffsetMT,
    onTabChanged,
    panelIndexMT,
    selectTarget,
  } = useTabsRootContext()
  const {
    onPageChange: onPageChangeProp,
    'main-thread:onPageChange': onPageChangeMTProp,
    'main-thread:onPageWillChange': onPageWillChangeMTProp,
    'main-thread:onOffsetChange': onOffsetChangeMTProp,
    ...viewPagerProps
  } = props

  const viewPagerRef = useRef<ViewPagerRef>(null)

  const scrollToPage = (
    index: number,
    smooth?: boolean,
    success?: (result: unknown) => void,
    fail?: (result: unknown) => void,
  ) => {
    viewPagerRef.current?.scrollToPage(index, smooth, success, fail)
  }

  useImperativeHandle(ref, () => ({ scrollToPage }))

  const setHasPanelMT = (hasPanel: boolean) => {
    'main thread'
    hasPanelMT.current.set(hasPanel)
  }

  useEffect(() => {
    runOnMainThread(setHasPanelMT)(true)
    return () => {
      runOnMainThread(setHasPanelMT)(false)
    }
  }, [])

  const onPageWillChangeMT = (event: ViewPagerWillChangeEvent) => {
    'main thread'
    const index = event.detail.index
    mtsLog(debugLog, '[lynx-ui tabs] page will change', index)
    panelIndexMT.current.set(index)
    onPageWillChangeMTProp?.(event)
  }

  const onPageChangeMT = (event: ViewPagerChangeEvent) => {
    'main thread'
    panelIndexMT.current.set(event.detail.index)
    onPageChangeMTProp?.(event)
  }

  const onOffsetChangeMT = (event: ViewPagerOffsetChangeEvent) => {
    'main thread'
    const offset = event.detail.offset
    mtsLog(debugLog, '[lynx-ui tabs] offset change', offset)
    indicatorOffsetMT.current.stop()
    indicatorOffsetMT.current.jump(offset)
    onOffsetChangeMTProp?.(event)
  }

  const onPageChange = (event: ViewPagerChangeEvent) => {
    const index = event.detail.index
    log(debugLog, '[lynx-ui tabs] page change', index)
    onPageChangeProp?.(event)
    onTabChanged?.(index)
  }

  useMotionValueRefEvent(
    selectTarget,
    'change',
    (target: { index: number, smooth: boolean }) => {
      'main thread'
      if (target.index < 0) {
        return
      }
      runOnBackground(scrollToPage)(target.index, target.smooth)
    },
  )

  return (
    <ViewPager
      {...viewPagerProps}
      ref={viewPagerRef}
      initialSelectIndex={initialSelectIndex}
      onPageChange={onPageChange}
      main-thread:onPageChange={onPageChangeMT}
      main-thread:onPageWillChange={onPageWillChangeMT}
      main-thread:onOffsetChange={onOffsetChangeMT}
    />
  )
}
