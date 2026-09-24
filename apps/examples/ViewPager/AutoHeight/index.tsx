// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ViewPager } from '@lynx-js/lynx-ui'

import { stories } from './data'
import { StoryCard } from './StoryCard'
import './index.css'

function App() {
  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <ViewPager
        data={stories}
        getItemKey={story => story.id}
        className='view-pager'
        itemClassName='view-pager-item'
      >
        {story => <StoryCard story={story} />}
      </ViewPager>
    </view>
  )
}

root.render(<App />)

export default App
