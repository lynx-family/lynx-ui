// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef } from '@lynx-js/react'

import {
  Button,
  TabsBar,
  TabsIndicator,
  TabsItem,
  TabsRoot,
} from '@lynx-js/lynx-ui'
import type { TabsData, TabsRootRef } from '@lynx-js/lynx-ui'

import '../shared/base.css'

const labels = ['Home', 'Discover', 'Messages', 'Profile', 'Settings']
const tabs: TabsData<string>[] = labels.map(label => ({
  tabItem: label,
  getTabKey: () => label,
}))

export function App() {
  const tabsRootRef = useRef<TabsRootRef>(null)

  return (
    <view className='tab-group-demo lunaris-dark'>
      <text className='tab-group-demo__title'>Imperative selection</text>
      <TabsRoot ref={tabsRootRef}>
        <TabsBar
          data={tabs}
          className='tab-group-demo__tabs'
          renderTabItem={item => (
            <TabsItem
              className='tab-group-demo__tab-item'
              tabKey={item.getTabKey()}
            >
              <text>{item.tabItem}</text>
            </TabsItem>
          )}
        >
          <TabsIndicator className='tab-group-demo__indicator'>
            <view className='tab-group-demo__indicator-line' />
          </TabsIndicator>
        </TabsBar>
      </TabsRoot>
      <Button
        className='tab-group-demo__button'
        onClick={() => tabsRootRef.current?.selectTab(1, true)}
      >
        <text>Select Discover smoothly</text>
      </Button>
      <Button
        className='tab-group-demo__button'
        onClick={() => tabsRootRef.current?.selectTab(4, false)}
      >
        <text>Select Settings instantly</text>
      </Button>
    </view>
  )
}

root.render(<App />)
