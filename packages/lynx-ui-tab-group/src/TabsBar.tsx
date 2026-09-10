// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { runOnMainThread, useMemo } from '@lynx-js/react'

import { log, useMemoizedFn } from '@lynx-js/lynx-ui-common'
import { ScrollView } from '@lynx-js/lynx-ui-scroll-view'
import { clsx } from 'clsx'

import { TabsContext, useTabsRootContext } from './TabsContext'
import type { TabsBarProps } from './types'

import './index.css'

export function TabsBar<T>(props: TabsBarProps<T>) {
  const {
    data,
    children,
    tabsItemWrapperClass,
    renderTabItem,
    ...scrollViewProps
  } = props

  const {
    hasPanel,
    tabSelectIndex,
    debugLog,
  } = useTabsRootContext()

  const tabKeys: string[] = useMemo(() => data.map(item => item.getTabKey()), [
    data,
  ])

  const selectTab = useMemoizedFn((tabsKey: string) => {
    const index = tabKeys.indexOf(tabsKey)
    log(debugLog, '[lynx-ui tabs] selectTab', tabsKey, index, hasPanel)
    runOnMainThread(() => {
      'main thread'
      tabSelectIndex.current.set(index)
    })()
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
