// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ViewPager } from '@lynx-js/lynx-ui'

import { stories } from './data'
import './index.css'

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <text className='heading'>Auto height</text>
      <text className='intro'>
        Leave the pager height unset when its content should define the layout.
      </text>
      <ViewPager
        data={stories}
        getItemKey={story => story.id}
        className='view-pager'
        itemClassName='view-pager-item'
      >
        {story => (
          <view className='card'>
            <text className='label'>{story.label}</text>
            <text className='title'>{story.title}</text>
            {story.lines.map(line => (
              <view key={line} className='row'>
                <view className='dot' />
                <text className='line'>{line}</text>
              </view>
            ))}
          </view>
        )}
      </ViewPager>
    </view>
  )
}

root.render(<App />)

export default App
