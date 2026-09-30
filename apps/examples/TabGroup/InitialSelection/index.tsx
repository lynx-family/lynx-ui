// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { TabsBar, TabsIndicator, TabsItem, TabsRoot } from '@lynx-js/lynx-ui'

import { tabs } from './data'
import './index.css'

export function App() {
  const [selectedIndex, setSelectedIndex] = useState(2)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='caption'>Initial selection: First Quarter</text>
      <TabsRoot
        initialSelectIndex={2}
        onTabChanged={setSelectedIndex}
      >
        <TabsBar
          data={tabs}
          className='tabs'
          renderTabItem={item => (
            <TabsItem
              key={item.getTabKey()}
              className='tab-item'
              tabKey={item.getTabKey()}
            >
              <text
                className={item.getTabKey()
                    === tabs[selectedIndex]?.getTabKey()
                  ? 'tab-label selected'
                  : 'tab-label'}
              >
                {item.tabItem}
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
