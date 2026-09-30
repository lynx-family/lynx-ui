// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { useMemo } from '@lynx-js/react'

import { log, useMemoizedFn } from '@lynx-js/lynx-ui-common'
import { ScrollView } from '@lynx-js/lynx-ui-scroll-view'
import { clsx } from 'clsx'

import {
  TabsContext,
  TabsItemKeyContext,
  useTabsRootContext,
} from './TabsContext'
import type { TabsBarProps } from './types'

import './styles.css'

export function TabsBar<T>(props: TabsBarProps<T>) {
  const {
    data,
    getTabKey,
    children,
    tabsItemWrapperClass,
    renderTabItem,
    ...scrollViewProps
  } = props

  const {
    debugLog,
    selectTabByIndex,
  } = useTabsRootContext()

  const tabKeys: string[] = useMemo(
    () => data.map((item, index) => getTabKey?.(item, index) ?? String(index)),
    [data, getTabKey],
  )

  const selectTab = useMemoizedFn((tabsKey: string) => {
    const index = tabKeys.indexOf(tabsKey)
    log(debugLog, '[lynx-ui tabs] selectTab', tabsKey, index)
    selectTabByIndex(index)
  })

  const tabsContextValue = useMemo(() => ({
    selectTab,
    tabKeyArray: tabKeys,
  }), [selectTab, tabKeys])

  // children: Indicator
  // renderedChildren: TabItem
  const renderedChildren = useMemo(
    () =>
      data.map((item, index) => (
        <TabsItemKeyContext.Provider
          key={tabKeys[index]}
          value={tabKeys[index]}
        >
          {renderTabItem?.(item, index)}
        </TabsItemKeyContext.Provider>
      )),
    [data, renderTabItem, tabKeys],
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
