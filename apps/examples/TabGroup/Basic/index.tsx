// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { TabsBar, TabsIndicator, TabsItem, TabsRoot } from '@lynx-js/lynx-ui'
import { clsx } from 'clsx'

import { tabs } from './data'
import './index.css'

export function App() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedTab = tabs[selectedIndex] ?? tabs[0]

  return (
    <view className='demo-container lunaris-dark'>
      <TabsRoot
        onClickItem={index => console.info('tabs click', index)}
        onTabChanged={index => {
          setSelectedIndex(index)
        }}
      >
        <TabsBar
          data={tabs}
          getTabKey={item => item.id}
          className='tabs'
          renderTabItem={item => (
            <TabsItem className='tab-item'>
              <text
                className={clsx('tab-label', {
                  selected: item.id === selectedTab.id,
                })}
              >
                {item.label}
              </text>
            </TabsItem>
          )}
        >
          <TabsIndicator className='indicator'>
            <view className='indicator-line' />
          </TabsIndicator>
        </TabsBar>
        <view className='content-panel'>
          <view className={clsx('content', selectedTab.contentVariant)}>
            <view className='content-copy'>
              <text className='content-title'>{selectedTab.label}</text>
              <text className='content-description'>
                {selectedTab.description}
              </text>
            </view>
          </view>
        </view>
      </TabsRoot>
    </view>
  )
}

root.render(<App />)
