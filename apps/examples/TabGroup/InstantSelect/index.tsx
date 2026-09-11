// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { TabsBar, TabsIndicator, TabsItem, TabsRoot } from '@lynx-js/lynx-ui'
import type { TabsData } from '@lynx-js/lynx-ui'

import '../shared/base.css'

const labels = ['Home', 'Discover', 'Messages', 'Profile']
const tabs: TabsData<string>[] = labels.map(label => ({
  tabItem: label,
  getTabKey: () => label,
}))

export function App() {
  return (
    <view className='tab-group-demo lunaris-dark'>
      <text className='tab-group-demo__title'>Instant indicator movement</text>
      <TabsRoot selectBehavior='instant'>
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
    </view>
  )
}

root.render(<App />)
