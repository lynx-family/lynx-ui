// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import {
  Button,
  TabsBar,
  TabsIndicator,
  TabsItem,
  TabsRoot,
} from '@lynx-js/lynx-ui'
import type { TabsRootRef } from '@lynx-js/lynx-ui'

import { tabs } from './data'
import './index.css'

export function App() {
  const tabsRootRef = useRef<TabsRootRef>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <text className='caption'>Imperative selection</text>
      <TabsRoot
        ref={tabsRootRef}
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
      <Button
        className='button'
        onClick={() => tabsRootRef.current?.selectTab(1, true)}
      >
        <text className='button-label'>Select Waxing Crescent smoothly</text>
      </Button>
      <Button
        className='button'
        onClick={() => tabsRootRef.current?.selectTab(4, false)}
      >
        <text className='button-label'>Select Full Moon instantly</text>
      </Button>
    </view>
  )
}

root.render(<App />)
