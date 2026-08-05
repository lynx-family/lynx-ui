// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import { cn } from '../../../utils'

interface ButtonProps {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'neutral' | 'primary' | 'secondary'
  disabled?: boolean
  children?: ReactNode
  className?: string
  bindtap?: () => void
}

function Button(props: ButtonProps) {
  const {
    size = 'md',
    variant = 'neutral',
    children,
    className,
    disabled,
    bindtap,
  } = props

  return (
    <view
      className={cn(
        'flex flex-row justify-center items-center rounded-full h-[48px] w-full active:opacity-50 transition-all',
        variant === 'neutral'
          ? 'bg-neutral'
          : (variant === 'secondary' ? 'bg-neutral-ambient' : 'bg-primary'),
        size
            === 'lg'
          ? 'h-[48px]'
          : 'h-[32px]',
        disabled && 'opacity-40',
        className,
      )}
      bindtap={bindtap}
    >
      <text
        className={cn(
          'text-base font-semibold',
          variant === 'neutral'
            ? 'text-neutral-content'
            : (variant === 'secondary'
              ? 'text-content'
              : 'text-primary-content'),
        )}
      >
        {children}
      </text>
    </view>
  )
}
export { Button }
