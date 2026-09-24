// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { ViewPager } from '@lynx-js/lynx-ui'
import type { ViewPagerRef } from '@lynx-js/lynx-ui'

import { stories } from './data'
import { PageIndicators } from './PageIndicators'
import { StoryCard } from './StoryCard'
import './index.css'

function App() {
  const pagerRef = useRef<ViewPagerRef>(null)
  const [pageIndex, setPageIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <ViewPager
        ref={pagerRef}
        data={stories}
        getItemKey={story => story.id}
        onPageChange={event => setPageIndex(event.detail.index)}
        className='view-pager'
        itemClassName='view-pager-item'
      >
        {story => <StoryCard story={story} />}
      </ViewPager>
      <PageIndicators
        stories={stories}
        activeIndex={pageIndex}
        onSelect={index => pagerRef.current?.scrollToPage(index)}
      />
    </view>
  )
}

root.render(<App />)

export default App
