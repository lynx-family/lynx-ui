// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  forwardRef,
  runOnBackground,
  runOnMainThread,
  useImperativeHandle,
  useMainThreadRef,
  useMemo,
  useRef,
} from '@lynx-js/react'

import { useMotionValueRef } from '@lynx-js/motion/mini'

import { TabsRootContext } from './TabsContext'
import type { TabSelectionTarget } from './TabsContext'
import type { TabsRootProps, TabsRootRef } from './types'

interface TabKeysRegistration {
  registrationId: number
  resolveTabKey: (index: number) => string | undefined
}

function useDataSubscript(initValue: number) {
  const hasPanelMT = useMotionValueRef<boolean>(false)
  const panelIndexMT = useMotionValueRef<number>(initValue)
  const tabsWidthMapMT = useMotionValueRef<Record<string, number>>({})
  const tabRegistrationMapMT = useMainThreadRef<Record<string, number>>({})
  const indicatorOffsetMT = useMotionValueRef<number>(initValue)
  const selectTarget = useMotionValueRef<TabSelectionTarget>({
    index: initValue,
    smooth: false,
    shouldNotifyTabChanged: false,
  })

  return {
    hasPanelMT,
    panelIndexMT,
    tabsWidthMapMT,
    tabRegistrationMapMT,
    indicatorOffsetMT,
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
    hasPanelMT,
    panelIndexMT,
    tabsWidthMapMT,
    tabRegistrationMapMT,
    indicatorOffsetMT,
    selectTarget,
  } = useDataSubscript(initialSelectIndex)
  const tabKeysRegistrationRef = useRef<TabKeysRegistration | null>(null)

  const registerTabKeys = (
    registrationId: number,
    resolveTabKey: (index: number) => string | undefined,
  ) => {
    tabKeysRegistrationRef.current = { registrationId, resolveTabKey }
  }
  const unregisterTabKeys = (registrationId: number) => {
    if (tabKeysRegistrationRef.current?.registrationId === registrationId) {
      tabKeysRegistrationRef.current = null
    }
  }
  const resolveTabKey = (index: number) => {
    return tabKeysRegistrationRef.current?.resolveTabKey(index)
  }
  const notifyClickItem = (index: number, tabKey: string) => {
    onClickItem?.(index, tabKey)
  }
  const notifyTabChanged = (index: number) => {
    const registration = tabKeysRegistrationRef.current
    const tabKey = resolveTabKey(index)
    if (registration === null || tabKey !== undefined) {
      onTabChanged?.(index, tabKey)
    }
  }
  const onTabChangedJS = (index: number, tabKey?: string) => {
    onTabChanged?.(index, tabKey)
  }

  const selectTabMT = (target: TabSelectionTarget) => {
    'main thread'
    if (panelIndexMT.current.get() === target.index) {
      return
    }
    selectTarget.current.set(target)
    if (!hasPanelMT.current.get()) {
      panelIndexMT.current.set(target.index)
      if (target.shouldNotifyTabChanged) {
        runOnBackground(onTabChangedJS)(target.index, target.tabKey)
      }
    }
  }
  const selectTabByIndex = (index: number, tabKey: string) => {
    runOnMainThread(selectTabMT)({
      index,
      smooth: selectBehavior !== 'instant',
      tabKey,
      shouldNotifyTabChanged: true,
    })
  }

  const unregisterTabWidthMT = (tabKey: string, registrationId: number) => {
    'main thread'
    if (tabRegistrationMapMT.current[tabKey] !== registrationId) {
      return
    }
    const nextValue = { ...tabsWidthMapMT.current.get() }
    delete nextValue[tabKey]
    tabsWidthMapMT.current.set(nextValue)
    delete tabRegistrationMapMT.current[tabKey]
  }
  const unregisterTabWidth = (tabKey: string, registrationId: number) => {
    runOnMainThread(unregisterTabWidthMT)(tabKey, registrationId)
  }

  const tabsRootContextValue = useMemo(
    () => ({
      debugLog,
      enableRTL,
      selectBehavior,
      indicatorAnimation,
      initialSelectIndex,
      hasPanelMT,
      panelIndexMT,
      tabsWidthMapMT,
      tabRegistrationMapMT,
      indicatorOffsetMT,
      selectTabByIndex,
      registerTabKeys,
      unregisterTabKeys,
      unregisterTabWidth,
      notifyClickItem,
      notifyTabChanged,
      selectTarget,
    }),
    [
      debugLog,
      enableRTL,
      selectBehavior,
      indicatorAnimation,
      initialSelectIndex,
      hasPanelMT,
      panelIndexMT,
      tabsWidthMapMT,
      tabRegistrationMapMT,
      indicatorOffsetMT,
      selectTabByIndex,
      registerTabKeys,
      unregisterTabKeys,
      unregisterTabWidth,
      notifyClickItem,
      notifyTabChanged,
      selectTarget,
    ],
  )

  useImperativeHandle(ref, () => ({
    selectTab: (index: number, smooth: boolean) => {
      const registration = tabKeysRegistrationRef.current
      const tabKey = resolveTabKey(index)
      runOnMainThread(selectTabMT)({
        index,
        smooth,
        tabKey,
        shouldNotifyTabChanged: registration === null || tabKey !== undefined,
      })
    },
  }))

  return (
    <TabsRootContext.Provider value={tabsRootContextValue}>
      {children}
    </TabsRootContext.Provider>
  )
})
