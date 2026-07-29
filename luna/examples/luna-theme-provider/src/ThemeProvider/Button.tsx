// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import { useLunaColor } from '@lynx-js/luna-reactlynx'

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  children?: ReactNode
  className?: string
}

function Button(props: ButtonProps) {
  const color = useLunaColor()
  const { variant = 'primary', disabled = false, children, className = '' } =
    props

  return (
    <view
      style={{
        justifyContent: 'center',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: '9999px',
        opacity: disabled ? 0.5 : 1,
        height: '48px',
        width: '100%',
        backgroundColor: variant === 'primary'
          ? color('primary')
          : color('neutralAmbient'),
      }}
      className={className}
    >
      <text
        style={{
          fontSize: '14px',
          lineHeight: '18px',
          fontWeight: '600',
          color: variant === 'primary'
            ? color('primaryContent')
            : color('content'),
        }}
      >
        {children}
      </text>
    </view>
  )
}
export { Button }
