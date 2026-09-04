// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { TabsBar, TabsIndicator, TabsItem, TabsRoot } from '@lynx-js/lynx-ui'
import type { TabsData } from '@lynx-js/lynx-ui'

import './index.css'

export function App() {
  const tabsArray = ['Home', 'Discover', 'Messages', 'Profile']
  const [tabs] = useState<TabsData<string>[]>(
    Array.from({ length: tabsArray.length }, (_, index) => ({
      tabItem: tabsArray[index],
      getTabKey: () => tabsArray[index],
    })),
  )

  return (
    <view className='tab-group-demo-basic'>
      <text className='tab-group-demo-basic__title'>TabGroup</text>
      <TabsRoot
        onClickItem={index => console.info('tabs click', index)}
        onTabChanged={index => console.info('tabs changed', index)}
      >
        <TabsBar
          data={tabs}
          className='tab-group-demo-basic__tabs'
          renderTabItem={(tabItemData: TabsData<string>) => (
            <TabsItem
              key={tabItemData.getTabKey()}
              className='tab-group-demo-basic__tab-item'
              tabKey={tabItemData.getTabKey()}
            >
              <text>{tabItemData.tabItem}</text>
            </TabsItem>
          )}
        >
          <TabsIndicator className='tab-group-demo-basic__indicator'>
            <view className='tab-group-demo-basic__indicator-line' />
          </TabsIndicator>
        </TabsBar>
      </TabsRoot>
    </view>
  )
}

root.render(<App />)
