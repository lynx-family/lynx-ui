// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Button, ViewPager } from '@lynx-js/lynx-ui'
import type { ViewPagerRef } from '@lynx-js/lynx-ui'

import { destinations } from './data'
import { DestinationCard } from './DestinationCard'
import { PageIndicators } from './PageIndicators'
import './index.css'

function App() {
  const pagerRef = useRef<ViewPagerRef>(null)
  const [index, setIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
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
        {destination => <DestinationCard destination={destination} />}
      </ViewPager>
      <PageIndicators destinations={destinations} activeIndex={index} />
      <view className='controls'>
        <Button
          className='control'
          disabled={index === 0}
          onClick={() => pagerRef.current?.scrollToPage(index - 1)}
        >
          <text className='control-label'>Previous</text>
        </Button>
        <Button
          className='control'
          disabled={index === destinations.length - 1}
          onClick={() => pagerRef.current?.scrollToPage(index + 1)}
        >
          <text className='control-label'>Next</text>
        </Button>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
