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

import { log, mtsLog } from '@lynx-js/lynx-ui-common'
import { ViewPager } from '@lynx-js/lynx-ui-view-pager'
import type {
  ViewPagerChangeEvent,
  ViewPagerOffsetChangeEvent,
  ViewPagerRef,
} from '@lynx-js/lynx-ui-view-pager'
import { useMotionValueRefEvent } from '@lynx-js/motion/mini'

import { useTabsRootContext } from './TabsContext'
import type { TabsPanelProps, TabsPanelRef } from './types'

export const TabsPanel = memo(
  forwardRef<TabsPanelRef, TabsPanelProps>(function TabsPanel(
    props: TabsPanelProps,
    ref,
  ) {
    const {
      debugLog,
      initialSelectIndex,
      panelIndex,
      panelOffset,
      tabSelectIndex,
      hasPanel,
      selectBehavior,
      onTabChanged,
      selectTarget,
      isFirstScreenSyncMT,
    } = useTabsRootContext()

    const viewpagerRef = useRef<ViewPagerRef>(null)

    useImperativeHandle(ref, () => ({
      selectTab,
    }))

    const selectTab = (
      index: number,
      smooth: boolean,
      // biome-ignore lint/suspicious/noExplicitAny: type-lynx should upgrade
      success?: (res: any) => void,
      // biome-ignore lint/suspicious/noExplicitAny: type-lynx should upgrade
      fail?: (res: any) => void,
    ) => {
      viewpagerRef.current?.selectTab(index, smooth, success, fail)
    }

    const setHasPanelMT = (has: boolean) => {
      'main thread'
      hasPanel.current.set(has)
    }

    // Make sure the Tabs know the ViewPager is mounted and cooperating
    useEffect(() => {
      runOnMainThread(setHasPanelMT)(true)
      return () => {
        runOnMainThread(setHasPanelMT)(false)
      }
    }, [])

    const changeIndexMT = (e: { detail: ViewPagerChangeEvent }) => {
      'main thread'
      mtsLog(debugLog, '[lynx-ui tabs] changeIndex', e.detail.index)
      panelIndex.current.set(e.detail.index)
      props.MTOnPageWillChange?.(e)
    }

    const changeOffsetMT = (e: { detail: ViewPagerOffsetChangeEvent }) => {
      'main thread'
      mtsLog(debugLog, '[lynx-ui tabs] changeOffset', e.detail.offset)
      panelOffset.current.set(e.detail.offset)
      props.MTOnOffsetChange?.(e)
    }

    const onPageChange = (e: { detail: ViewPagerChangeEvent }) => {
      log(debugLog, '[lynx-ui tabs] onPageChange', e.detail.index)
      props.onPageChange?.(e)
      onTabChanged?.(e.detail.index)
    }

    useMotionValueRefEvent(tabSelectIndex, 'change', (index) => {
      'main thread'
      const shouldSmooth = !isFirstScreenSyncMT.current
        && selectBehavior === 'smooth'
      runOnBackground(selectTab)(index, shouldSmooth)
    })

    useMotionValueRefEvent(
      selectTarget,
      'change',
      (target: { index: number, smooth: boolean }) => {
        'main thread'
        const { index, smooth } = target
        if (index < 0) return
        runOnBackground(selectTab)(
          index,
          !isFirstScreenSyncMT.current && smooth,
        )
      },
    )

    return (
      <ViewPager
        {...props}
        ref={viewpagerRef}
        initialSelectIndex={initialSelectIndex}
        onPageChange={onPageChange}
        MTOnOffsetChange={changeOffsetMT}
        MTOnPageWillChange={changeIndexMT}
      />
    )
  }),
)
