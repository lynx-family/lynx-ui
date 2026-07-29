// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import { clsx } from 'clsx'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  children?: ReactNode
  className?: string
}

function Button(props: ButtonProps) {
  const { variant = 'primary', disabled = false, children, className = '' } =
    props

  return (
    <view
      className={clsx(
        'luna-pill',
        disabled && 'luna-pill--disabled',
        variant === 'primary' ? 'luna-pill--primary' : 'luna-pill--neutral',
        className,
      )}
    >
      <text
        className={clsx(
          'luna-text',
          variant === 'primary' ? 'luna-text--primary' : 'luna-text--neutral',
          className,
        )}
      >
        {children}
      </text>
    </view>
  )
}
export { Button }
