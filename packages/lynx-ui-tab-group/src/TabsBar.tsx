// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { useEffect, useMemo } from '@lynx-js/react'

import { log, useMemoizedFn } from '@lynx-js/lynx-ui-common'
import { ScrollView } from '@lynx-js/lynx-ui-scroll-view'
import { clsx } from 'clsx'

import { TabsContext, useTabsRootContext } from './TabsContext'
import type { TabsBarProps } from './types'
import { findUniqueTabIndex, getUniqueTabKey } from './utils/tabKeys'

import './styles.css'

let nextTabsBarRegistrationId = 0

export function TabsBar<T>(props: TabsBarProps<T>) {
  const {
    data,
    children,
    tabsItemWrapperClass,
    renderTabItem,
    ...scrollViewProps
  } = props

  const {
    debugLog,
    registerTabKeys,
    selectTabByIndex,
    unregisterTabKeys,
  } = useTabsRootContext()

  const tabKeys: string[] = useMemo(() => data.map(item => item.getTabKey()), [
    data,
  ])
  const registrationId = useMemo(() => nextTabsBarRegistrationId++, [])
  // The registered callback stays stable while reading the latest tab order.
  const resolveTabKey = useMemoizedFn((index: number) => {
    return getUniqueTabKey(tabKeys, index)
  })

  useEffect(() => {
    registerTabKeys(registrationId, resolveTabKey)
    return () => {
      unregisterTabKeys(registrationId)
    }
  }, [
    registerTabKeys,
    registrationId,
    resolveTabKey,
    unregisterTabKeys,
  ])

  const selectTab = useMemoizedFn((tabsKey: string) => {
    const index = findUniqueTabIndex(tabKeys, tabsKey)
    log(debugLog, '[lynx-ui tabs] selectTab', tabsKey, index)
    if (index !== undefined) {
      selectTabByIndex(index, tabsKey)
    }
    return index
  })

  const tabsContextValue = useMemo(() => ({
    selectTab,
    tabKeyArray: tabKeys,
  }), [selectTab, tabKeys])

  // children: Indicator
  // renderedChildren: TabItem
  const renderedChildren = useMemo(
    () => data.map(item => renderTabItem?.(item)),
    [data, renderTabItem],
  )

  return (
    <TabsContext.Provider value={tabsContextValue}>
      <ScrollView
        scrollOrientation='horizontal'
        {...scrollViewProps}
      >
        <view
          className={clsx('lynx-ui-tab-group__items', tabsItemWrapperClass)}
        >
          {children}
          {renderedChildren}
        </view>
      </ScrollView>
    </TabsContext.Provider>
  )
}
