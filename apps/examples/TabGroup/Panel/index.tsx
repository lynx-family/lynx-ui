// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  TabsBar,
  TabsIndicator,
  TabsItem,
  TabsPanel,
  TabsRoot,
} from '@lynx-js/lynx-ui'

import { pages, tabs } from './data'
import './index.css'

export function App() {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <TabsRoot
        initialSelectIndex={0}
        onTabChanged={setSelectedIndex}
      >
        <TabsBar
          data={tabs}
          className='tabs'
          tabsItemWrapperClass='tab-row'
          renderTabItem={item => {
            const selected = item.getTabKey() === pages[selectedIndex]?.id

            return (
              <TabsItem
                key={item.getTabKey()}
                className='tab-item'
                tabKey={item.getTabKey()}
              >
                <text
                  className={selected
                    ? 'tab-label selected'
                    : 'tab-label'}
                >
                  {item.tabItem.label}
                </text>
              </TabsItem>
            )
          }}
        >
          <TabsIndicator className='indicator'>
            <view className='indicator-line' />
          </TabsIndicator>
        </TabsBar>
        <view className='panel'>
          <TabsPanel
            data={pages}
            getItemKey={page => page.id}
            className='view-pager'
            itemClassName='view-pager-item'
            style={{ width: '100%', height: '100%' }}
          >
            {page => (
              <view className={page.className}>
                <view className='page-copy'>
                  <text className='page-title'>TabGroup</text>
                  <text className='page-package'>@lynx-js/lynx-ui</text>
                </view>
              </view>
            )}
          </TabsPanel>
        </view>
      </TabsRoot>
    </view>
  )
}

root.render(<App />)
