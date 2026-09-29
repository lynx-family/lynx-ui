// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import { Button, List } from '@lynx-js/lynx-ui'

import { stories } from './data'
import './base.css'

export function DemoLayout({
  title,
  controls,
  children,
}: {
  title: string
  controls: ReactNode
  children: ReactNode
}) {
  return (
    <view className='demo-container lunaris-dark'>
      <view className='sc-masthead'>
        <text className='sc-mode'>{title}</text>
      </view>
      {controls}
      <view className='sc-frame'>{children}</view>
    </view>
  )
}

export function CoordinatorControls({
  enabled,
  onExpand,
  onCollapse,
  onShowDetails,
  onToggleEnabled,
}: {
  enabled: boolean
  onExpand: () => void
  onCollapse: () => void
  onShowDetails: () => void
  onToggleEnabled: () => void
}) {
  return (
    <view className='sc-controls'>
      <Button className='sc-control' onClick={onExpand}>
        <text className='sc-control-label'>Expand</text>
      </Button>
      <Button className='sc-control' onClick={onCollapse}>
        <text className='sc-control-label'>Collapse</text>
      </Button>
      <Button className='sc-control' onClick={onShowDetails}>
        <text className='sc-control-label'>Details</text>
      </Button>
      <Button className='sc-control' onClick={onToggleEnabled}>
        <text className='sc-control-label'>
          {enabled ? 'Lock' : 'Unlock'}
        </text>
      </Button>
    </view>
  )
}

export function RefreshControls({
  enabled,
  onRefresh,
  onToggleEnabled,
}: {
  enabled: boolean
  onRefresh: () => void
  onToggleEnabled: () => void
}) {
  return (
    <view className='sc-controls'>
      <Button className='sc-control' onClick={onRefresh}>
        <text className='sc-control-label'>Refresh now</text>
      </Button>
      <Button className='sc-control' onClick={onToggleEnabled}>
        <text className='sc-control-label'>
          {enabled ? 'Disable refresh' : 'Enable refresh'}
        </text>
      </Button>
    </view>
  )
}

export function Toolbar({
  title = 'The collection',
  status,
}: {
  title?: string
  status: string
}) {
  return (
    <view className='sc-toolbar'>
      <text className='sc-toolbar-title'>{title}</text>
      <text className='sc-toolbar-status'>{status}</text>
    </view>
  )
}

export function Cover({ status }: { status: string }) {
  return (
    <view className='sc-cover'>
      <view className='sc-hero'>
        <text className='sc-hero-title'>Field notes</text>
      </view>
      <view id='collection-details' className='sc-details'>
        <text className='sc-detail-title'>{status}</text>
      </view>
    </view>
  )
}

function Story({ index }: { index: number }) {
  const story = stories[index % stories.length]
  return (
    <view className='sc-story'>
      <view className='sc-story-number'>
        <text className='sc-number'>{String(index + 1).padStart(2, '0')}</text>
      </view>
      <view className='sc-story-copy'>
        <text className='sc-story-title'>{story}</text>
      </view>
    </view>
  )
}

export function renderStories(listId: string) {
  return Array.from(
    { length: 16 },
    (_, index) => (
      <list-item key={index} item-key={`${listId}-${index}`}>
        <Story index={index} />
      </list-item>
    ),
  )
}

export function StoryList({
  listId,
  bounces = true,
}: {
  listId: string
  bounces?: boolean
}) {
  return (
    <List
      className='sc-list'
      listId={listId}
      listType='single'
      spanCount={1}
      scrollOrientation='vertical'
      useRefactorList
      bounces={bounces}
    >
      {renderStories(listId)}
    </List>
  )
}
