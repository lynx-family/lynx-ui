// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  forwardRef,
  runOnMainThread,
  useEffect,
  useImperativeHandle,
  useMainThreadRef,
  useMemo,
} from '@lynx-js/react'

import { useMotionValueRef } from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'

import { TabsRootContext } from './TabsContext'
import type { TabsRootProps, TabsRootRef } from './types'

function useDataSubscript(initValue: number) {
  const hasPanel = useMotionValueRef<boolean>(false)
  const panelOffset = useMotionValueRef<number>(initValue)
  const panelIndex = useMotionValueRef<number>(initValue)
  const tabSelectIndex = useMotionValueRef<number>(initValue)
  const tabsWidthMapMT = useMotionValueRef<Record<string, number>>({})
  const tabRegistrationMapMT = useMainThreadRef<Record<string, number>>({})
  const indicatorOffsetMT = useMotionValueRef<number>(initValue)
  const indicatorElementMT = useMainThreadRef<MainThread.Element>(null)
  const hasRenderedIndicatorMT = useMainThreadRef<boolean>(false)
  const isFirstScreenSyncMT = useMainThreadRef<boolean>(true)
  const selectTarget = useMotionValueRef<{ index: number, smooth: boolean }>({
    index: -1,
    smooth: false,
  })

  return {
    hasPanel,
    panelIndex,
    panelOffset,
    tabSelectIndex,
    tabsWidthMapMT,
    tabRegistrationMapMT,
    indicatorOffsetMT,
    indicatorElementMT,
    hasRenderedIndicatorMT,
    isFirstScreenSyncMT,
    selectTarget,
  }
}

export const TabsRoot = forwardRef<TabsRootRef, TabsRootProps>((props, ref) => {
  const {
    initialSelectIndex = 0,
    debugLog = false,
    children,
    onClickItem,
    onTabChanged,
    selectBehavior = 'smooth',
    indicatorAnimation,
    enableRTL = false,
  } = props
  const {
    panelIndex,
    panelOffset,
    tabSelectIndex,
    tabsWidthMapMT,
    tabRegistrationMapMT,
    indicatorOffsetMT,
    indicatorElementMT,
    hasRenderedIndicatorMT,
    isFirstScreenSyncMT,
    hasPanel,
    selectTarget,
  } = useDataSubscript(initialSelectIndex)

  const clearFirstScreenSyncMT = () => {
    'main thread'
    isFirstScreenSyncMT.current = false
  }

  useEffect(() => {
    runOnMainThread(clearFirstScreenSyncMT)()
  }, [])

  const tabsRootContextValue = useMemo(
    () => ({
      debugLog,
      enableRTL,
      selectBehavior,
      indicatorAnimation,
      initialSelectIndex,
      hasPanel,
      panelIndex,
      panelOffset,
      tabSelectIndex,
      tabsWidthMapMT,
      tabRegistrationMapMT,
      indicatorOffsetMT,
      indicatorElementMT,
      hasRenderedIndicatorMT,
      isFirstScreenSyncMT,
      onTabChanged,
      onClickItem,
      selectTarget,
    }),
    [
      debugLog,
      enableRTL,
      selectBehavior,
      indicatorAnimation,
      initialSelectIndex,
      hasPanel,
      onClickItem,
      onTabChanged,
      panelIndex,
      panelOffset,
      tabSelectIndex,
      tabsWidthMapMT,
      tabRegistrationMapMT,
      indicatorOffsetMT,
      indicatorElementMT,
      hasRenderedIndicatorMT,
      isFirstScreenSyncMT,
      selectTarget,
    ],
  )

  const selectTabMT = (target: { index: number, smooth: boolean }) => {
    'main thread'
    selectTarget.current.set(target)
    tabSelectIndex.current.set(target.index)
  }

  useImperativeHandle(ref, () => ({
    selectTab: (index: number, smooth: boolean) => {
      runOnMainThread(selectTabMT)({ index, smooth })
    },
  }))

  return (
    <TabsRootContext.Provider value={tabsRootContextValue}>
      {children}
    </TabsRootContext.Provider>
  )
})
