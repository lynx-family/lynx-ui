// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { TabsBar, TabsIndicator, TabsItem, TabsRoot } from '@lynx-js/lynx-ui'

import { tabs } from './data'
import './index.css'

type TabSizing = 'equal' | 'content'

function TabStrip(
  { caption, sizing }: { caption: string, sizing: TabSizing },
) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <view className='example-section'>
      <text className='caption'>{caption}</text>
      <TabsRoot onTabChanged={setSelectedIndex}>
        <TabsBar
          data={tabs}
          className='tabs'
          renderTabItem={item => (
            <TabsItem
              key={item.getTabKey()}
              className={sizing === 'equal'
                ? 'tab-item tab-item-equal'
                : 'tab-item'}
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

export function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <TabStrip caption='Equal width' sizing='equal' />
      <TabStrip caption='Content width' sizing='content' />
    </view>
  )
}

root.render(<App />)
