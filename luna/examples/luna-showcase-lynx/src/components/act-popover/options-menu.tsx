// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import { cn } from '../../utils'

function Text({ children }: { children: string }) {
  return <text className='text-start text-base text-content'>{children}</text>
}

function MutedText({ children }: { children: string }) {
  return (
    <text className='text-start text-base text-content-muted'>{children}</text>
  )
}

function Row({ label, value }: { label: string, value: string }) {
  return (
    <view className='w-full flex flex-row items-center justify-between'>
      <Text>{label}</Text>
      <MutedText>{value}</MutedText>
    </view>
  )
}

function Column(
  { children, className }: { children: ReactNode, className?: string },
) {
  return (
    <view className={cn('w-full flex flex-col gap-[6px]', className)}>
      {children}
    </view>
  )
}

function OptionsMenu() {
  return (
    <view className='w-full flex flex-col gap-[12px]'>
      <Column className='gap-[8px]'>
        <text className='text-start text-lg font-semibold text-content'>
          Narrative Options
        </text>
        <MutedText>
          Moments persist. Actions are transient. Tap trigger or content to
          close.
        </MutedText>
      </Column>
      <view className='w-full h-[1px] bg-rule' />
      <Column>
        <text className='text-start text-xs tracking-[0.08em] text-content-subtle'>
          ACTIONS
        </text>
        <Column>
          <Text>Capture</Text>
          <Text>Reflect</Text>
          <Text>Archive</Text>
        </Column>
      </Column>
      <view className='w-full h-[1px] bg-rule' />
      <Column>
        <text className='text-start text-[10px] tracking-[0.08em] text-content-subtle'>
          SETTINGS
        </text>
        <Column>
          <Row label='Notifications' value='On' />
          <Row label='Reminders' value='Daily' />
        </Column>
      </Column>
    </view>
  )
}

export { OptionsMenu }
