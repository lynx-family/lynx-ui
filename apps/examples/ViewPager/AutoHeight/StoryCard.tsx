// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Story } from './data'

export function StoryCard({ story }: { story: Story }) {
  return (
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
  )
}
