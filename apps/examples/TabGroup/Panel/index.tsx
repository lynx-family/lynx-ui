// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  TabsBar,
  TabsIndicator,
  TabsItem,
  TabsPanel,
  TabsRoot,
} from '@lynx-js/lynx-ui'
import type { TabsData } from '@lynx-js/lynx-ui'

import './index.css'

const labels = ['Home', 'Discover', 'Messages', 'Profile']
const tabs: TabsData<string>[] = labels.map(label => ({
  tabItem: label,
  getTabKey: () => label,
}))

export function App() {
  return (
    <view className='tab-group-panel'>
      <TabsRoot initialSelectIndex={0}>
        <TabsBar
          data={tabs}
          className='tab-group-panel__tabs'
          renderTabItem={item => (
            <TabsItem
              key={item.getTabKey()}
              className='tab-group-panel__tab'
              tabKey={item.getTabKey()}
            >
              <text>{item.tabItem}</text>
            </TabsItem>
          )}
        >
          <TabsIndicator className='tab-group-panel__indicator'>
            <view className='tab-group-panel__indicator-line' />
          </TabsIndicator>
        </TabsBar>
        <TabsPanel style={{ width: '100%', height: '400px' }}>
          {labels.map((label, index) => (
            <view
              key={label}
              className={`tab-group-panel__page tab-group-panel__page--${index}`}
            >
              <text className='tab-group-panel__page-label'>{label}</text>
            </view>
          ))}
        </TabsPanel>
      </TabsRoot>
    </view>
  )
}

root.render(<App />)
