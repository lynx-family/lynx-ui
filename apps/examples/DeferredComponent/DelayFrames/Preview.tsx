// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

interface PreviewPanelProps {
  children: ReactNode
  meta: string
}

export function PreviewPanel({ children, meta }: PreviewPanelProps) {
  return (
    <view className='panel panel-single'>
      <view className='panel-header'>
        <text className='label'>Placeholder to content</text>
        <text className='meta'>{meta}</text>
      </view>
      {children}
    </view>
  )
}

export function DelayPlaceholder() {
  return (
    <view className='placeholder'>
      <view className='placeholder-mark' />
      <text className='placeholder-label'>Preparing content</text>
    </view>
  )
}

interface ResizableContentProps {
  children: ReactNode
  expanded: boolean
}

export function ResizableContent(
  { children, expanded }: ResizableContentProps,
) {
  return (
    <view className={expanded ? 'content content-expanded' : 'content'}>
      <view className='status'>
        <view className='status-dot' />
        <text className='status-label'>Content mounted</text>
      </view>
      {children}
    </view>
  )
}
