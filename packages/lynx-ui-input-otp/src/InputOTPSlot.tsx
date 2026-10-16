// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { memo } from '@lynx-js/react'
import type { ReactElement } from '@lynx-js/react'

import { clsx } from 'clsx'

import { useInputOTPContext } from './InputOTPContext'
import type { InputOTPSlotProps, InputOTPSlotRenderProps } from './types'

type InputOTPSlotComponent = (props: InputOTPSlotProps) => ReactElement

export const InputOTPSlot = memo(InputOTPSlotImpl) as InputOTPSlotComponent

function InputOTPSlotImpl(props: InputOTPSlotProps) {
  const {
    index,
    className,
    style,
    children,
  } = props
  const context = useInputOTPContext()

  const {
    value,
    length,
    focused,
    complete,
    disabled,
    invalid,
  } = context
  const char = value[index]
  const isFilled = char !== undefined
  const hasFakeCaret = focused
    && !disabled
    && value.length < length
    && index === value.length
  const slotState: InputOTPSlotRenderProps = {
    index,
    char,
    focused: hasFakeCaret,
    filled: isFilled,
    complete,
    disabled,
    invalid,
  }
  const renderedChildren = typeof children === 'function'
    ? children(slotState)
    : children

  return (
    <view
      className={clsx(className, {
        'ui-focused': hasFakeCaret,
        'ui-filled': isFilled,
        'ui-complete': complete,
        'ui-disabled': disabled,
        'ui-invalid': invalid,
      })}
      style={style}
    >
      {children === undefined
        ? (
          <>
            {char === undefined
              ? null
              : <text>{char}</text>}
            {hasFakeCaret
              ? <view />
              : null}
          </>
        )
        : renderedChildren}
    </view>
  )
}
