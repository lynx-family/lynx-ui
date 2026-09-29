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
import type { TabsRootProps, TabsRootRef } from './types'
import { getUniqueTabKey } from './utils/tabKeys'

interface TabKeysRegistration {
  registrationId: number
  tabKeys: string[]
}

function useDataSubscript(initValue: number) {
  const hasPanelMT = useMotionValueRef<boolean>(false)
  const panelIndexMT = useMotionValueRef<number>(initValue)
  const tabKeysRegistrationMT = useMainThreadRef<TabKeysRegistration | null>(
    null,
  )
  const tabsWidthMapMT = useMotionValueRef<Record<string, number>>({})
  const tabRegistrationMapMT = useMainThreadRef<Record<string, number>>({})
  const indicatorOffsetMT = useMotionValueRef<number>(initValue)
  const selectTarget = useMotionValueRef<{ index: number, smooth: boolean }>({
    index: initValue,
    smooth: false,
  })

  return {
    hasPanelMT,
    panelIndexMT,
    tabKeysRegistrationMT,
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
    tabKeysRegistrationMT,
    tabsWidthMapMT,
    tabRegistrationMapMT,
    indicatorOffsetMT,
    selectTarget,
  } = useDataSubscript(initialSelectIndex)
  const tabKeysRegistrationRef = useRef<TabKeysRegistration | null>(null)

  const registerTabKeysMT = (registration: TabKeysRegistration) => {
    'main thread'
    tabKeysRegistrationMT.current = registration
  }
  const unregisterTabKeysMT = (registrationId: number) => {
    'main thread'
    if (tabKeysRegistrationMT.current?.registrationId === registrationId) {
      tabKeysRegistrationMT.current = null
    }
  }
  const registerTabKeys = (registrationId: number, tabKeys: string[]) => {
    const registration = { registrationId, tabKeys }
    tabKeysRegistrationRef.current = registration
    runOnMainThread(registerTabKeysMT)(registration)
  }
  const unregisterTabKeys = (registrationId: number) => {
    if (tabKeysRegistrationRef.current?.registrationId === registrationId) {
      tabKeysRegistrationRef.current = null
    }
    runOnMainThread(unregisterTabKeysMT)(registrationId)
  }
  const resolveTabKey = (index: number) =>
    getUniqueTabKey(
      tabKeysRegistrationRef.current?.tabKeys ?? [],
      index,
    )
  const notifyClickItem = (index: number) => {
    const tabKey = resolveTabKey(index)
    if (tabKey !== undefined) {
      onClickItem?.(index, tabKey)
    }
  }
  const notifyTabChanged = (index: number) => {
    const tabKey = resolveTabKey(index)
    if (tabKey !== undefined) {
      onTabChanged?.(index, tabKey)
    }
  }
  const onTabChangedJS = (index: number, tabKey: string) => {
    onTabChanged?.(index, tabKey)
  }

  const selectTabMT = (target: { index: number, smooth: boolean }) => {
    'main thread'
    if (panelIndexMT.current.get() === target.index) {
      return
    }
    selectTarget.current.set(target)
    if (!hasPanelMT.current.get()) {
      panelIndexMT.current.set(target.index)
      const tabKeys = tabKeysRegistrationMT.current?.tabKeys ?? []
      const tabKey = tabKeys[target.index]
      if (
        tabKey !== undefined
        && tabKeys.indexOf(tabKey) === target.index
        && tabKeys.lastIndexOf(tabKey) === target.index
      ) {
        runOnBackground(onTabChangedJS)(target.index, tabKey)
      }
    }
  }
  const selectTabByIndex = (index: number) => {
    runOnMainThread(selectTabMT)({
      index,
      smooth: selectBehavior !== 'instant',
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
      runOnMainThread(selectTabMT)({ index, smooth })
    },
  }))

  return (
    <TabsRootContext.Provider value={tabsRootContextValue}>
      {children}
    </TabsRootContext.Provider>
  )
})
