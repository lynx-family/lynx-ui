// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import { cn } from '../../utils'

function ActButton() {
  return (
    <view className='size-full flex flex-col justify-center items-center gap-[8px] px-[64px] bg-canvas transition-colors duration-300 ease-in-out'>
      {/* Button Demo */}
      <Button>Let it bloom</Button>
      <Button variant='secondary'>
        Stay asleep
      </Button>
    </view>
  )
}

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  children?: ReactNode
  className?: string
}

function Button(props: ButtonProps) {
  const { variant = 'primary', children, className, disabled } = props
  return (
    <view
      className={cn(
        'flex flex-row justify-center items-center rounded-full h-[48px] w-full active:opacity-50 transition-opacity ease-in-out',
        className,
        variant === 'primary' ? 'bg-primary' : 'bg-neutral-ambient',
        disabled && 'opacity-40',
      )}
    >
      <text
        className={cn(
          'text-base font-semibold',
          variant === 'primary' ? 'text-primary-content' : 'text-content',
        )}
      >
        {children}
      </text>
    </view>
  )
}
export { ActButton }
