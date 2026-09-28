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
    <view className='demo-container lunaris-dark'>
      <view className='stage'>
        <TabsRoot initialSelectIndex={0}>
          <TabsBar
            data={tabs}
            className='tabs'
            tabsItemWrapperClass='tab-row'
            renderTabItem={item => (
              <TabsItem
                key={item.getTabKey()}
                className='tab'
                tabKey={item.getTabKey()}
              >
                <text>{item.tabItem}</text>
              </TabsItem>
            )}
          >
            <TabsIndicator className='indicator'>
              <view className='indicator-line' />
            </TabsIndicator>
          </TabsBar>
          <TabsPanel
            data={labels}
            getItemKey={label => label}
            className='view-pager'
            itemClassName='view-pager-item'
            style={{ width: '100%', height: '360px' }}
          >
            {(_, index) => (
              <view className='page'>
                <text className='page-number'>
                  {String(index + 1).padStart(2, '0')}
                </text>
              </view>
            )}
          </TabsPanel>
        </TabsRoot>
      </view>
    </view>
  )
}

root.render(<App />)
