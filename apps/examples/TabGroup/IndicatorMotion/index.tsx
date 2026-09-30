// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { TabsBar, TabsIndicator, TabsItem, TabsRoot } from '@lynx-js/lynx-ui'

import { tabs } from './data'
import './index.css'

const springAnimation = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 1,
} as const

type IndicatorMode = 'spring' | 'instant'

function TabStrip(
  { caption, mode, initialSelectIndex }: {
    caption: string
    mode: IndicatorMode
    initialSelectIndex: number
  },
) {
  const [selectedIndex, setSelectedIndex] = useState(initialSelectIndex)

  return (
    <view className='example-section'>
      <text className='caption'>{caption}</text>
      <TabsRoot
        initialSelectIndex={initialSelectIndex}
        selectBehavior={mode === 'instant' ? 'instant' : 'smooth'}
        indicatorAnimation={mode === 'spring' ? springAnimation : undefined}
        onTabChanged={setSelectedIndex}
      >
        <TabsBar
          data={tabs}
          getTabKey={item => item.id}
          className='tabs'
          renderTabItem={item => (
            <TabsItem className='tab-item'>
              <text
                className={item.id === tabs[selectedIndex]?.id
                  ? 'tab-label selected'
                  : 'tab-label'}
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
      </TabsRoot>
    </view>
  )
}

export function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <TabStrip
        caption='Custom spring animation'
        mode='spring'
        initialSelectIndex={1}
      />
      <TabStrip
        caption='Instant movement'
        mode='instant'
        initialSelectIndex={0}
      />
    </view>
  )
}

root.render(<App />)
