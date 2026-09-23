// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Button, ViewPager } from '@lynx-js/lynx-ui'
import type { ViewPagerRef } from '@lynx-js/lynx-ui'

import { destinations } from './data'
import './index.css'

function App() {
  const pagerRef = useRef<ViewPagerRef>(null)
  const [index, setIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='header'>
        <text className='overline'>FEATURED JOURNEYS</text>
        <text className='heading'>Swipe to explore</text>
        <text className='intro'>
          Drag the gallery or use the controls to select a page.
        </text>
      </view>
      <ViewPager
        ref={pagerRef}
        data={destinations}
        getItemKey={destination => destination.id}
        lazyOptions={{
          enableLazy: true,
          scene: 'view-pager-gallery',
          exposureLeft: '80px',
          exposureRight: '80px',
        }}
        onPageChange={event => setIndex(event.detail.index)}
        className='view-pager'
        itemClassName='view-pager-item'
      >
        {destination => (
          <view
            className={`card ${destination.className}`}
            accessibility-label={destination.title}
          >
            <text className='number'>
              {destination.number}
            </text>
            <view className='copy'>
              <text className='eyebrow'>
                {destination.eyebrow}
              </text>
              <text className='title'>
                {destination.title}
              </text>
              <text className='description'>
                {destination.description}
              </text>
            </view>
          </view>
        )}
      </ViewPager>
      <view className='status'>
        <view className='indicators'>
          {destinations.map((destination, pageIndex) => (
            <view
              key={destination.id}
              className={`indicator ${pageIndex === index ? 'active' : ''}`}
            />
          ))}
        </view>
        <text className='count'>
          {index + 1} / {destinations.length}
        </text>
      </view>
      <view className='controls'>
        <Button
          disabled={index === 0}
          onClick={() => pagerRef.current?.scrollToPage(index - 1)}
        >
          <text>Previous</text>
        </Button>
        <Button
          disabled={index === destinations.length - 1}
          onClick={() => pagerRef.current?.scrollToPage(index + 1)}
        >
          <text>Next</text>
        </Button>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
