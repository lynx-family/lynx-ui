// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { TabsBar, TabsIndicator, TabsItem, TabsRoot } from '@lynx-js/lynx-ui'

import { tabs } from './data'
import './index.css'

export function App() {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='caption'>Basic tab selection</text>
      <TabsRoot
        onClickItem={index => console.info('tabs click', index)}
        onTabChanged={index => {
          setSelectedIndex(index)
          console.info('tabs changed', index)
        }}
      >
        <TabsBar
          data={tabs}
          className='tabs'
          renderTabItem={tabItemData => (
            <TabsItem
              key={tabItemData.getTabKey()}
              className='tab-item'
              tabKey={tabItemData.getTabKey()}
            >
              <text
                className={tabItemData.getTabKey()
                    === tabs[selectedIndex]?.getTabKey()
                  ? 'tab-label selected'
                  : 'tab-label'}
              >
                {tabItemData.tabItem}
              </text>
            </TabsItem>
          )}
        >
          <TabsIndicator className='indicator'>
            <view className='indicator-line' />
          </TabsIndicator>
        </TabsBar>
      </TabsRoot>
    </view>
  )
}

root.render(<App />)
