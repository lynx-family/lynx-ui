// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

interface ComparisonPanelProps {
  children: ReactNode
  label: string
  meta: string
}

export function ComparisonPanel(
  { children, label, meta }: ComparisonPanelProps,
) {
  return (
    <view className='panel'>
      <view className='panel-header'>
        <text className='label'>{label}</text>
        <text className='meta'>{meta}</text>
      </view>
      <view className='preview'>{children}</view>
    </view>
  )
}

export function DeferredPlaceholder() {
  return (
    <view className='placeholder'>
      <text className='placeholder-label'>Waiting for layout</text>
    </view>
  )
}

export function MountedContent() {
  return (
    <view className='content content-fill'>
      <view className='status'>
        <view className='status-dot' />
        <text className='status-label'>Mounted</text>
      </view>
      <view className='cells'>
        {Array.from(
          { length: 300 },
          (_, index) => <view key={index} flatten={false} className='cell' />,
        )}
      </view>
    </view>
  )
}
