// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { ViewPager } from '@lynx-js/lynx-ui'

import { stories } from './data'
import './index.css'

function App() {
  return (
    <view className='view-pager-auto-height lunaris-dark'>
      <text className='view-pager-auto-height__heading'>Auto height</text>
      <text className='view-pager-auto-height__intro'>
        Leave the pager height unset when its content should define the layout.
      </text>
      <ViewPager
        data={stories}
        getItemKey={story => story.id}
        className='view-pager-auto-height__pager'
        itemClassName='view-pager-auto-height__item'
      >
        {story => (
          <view className='view-pager-auto-height__card'>
            <text className='view-pager-auto-height__label'>{story.label}</text>
            <text className='view-pager-auto-height__title'>{story.title}</text>
            {story.lines.map(line => (
              <view key={line} className='view-pager-auto-height__row'>
                <view className='view-pager-auto-height__dot' />
                <text className='view-pager-auto-height__line'>{line}</text>
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
