// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useState } from '@lynx-js/react'

import { useMemoizedFn } from '@lynx-js/lynx-ui-common'
import { clsx } from 'clsx'

import type { SelectProps } from './types'

export const Select = (props: SelectProps) => {
  const {
    value,
    defaultValue,
    options,
    onValueChange,
    className,
    style,
    optionClassName,
    optionStyle,
    containerProps,
    optionProps,
  } = props

  const isControlled = value !== undefined
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const actualValue = isControlled ? value : uncontrolledValue

  const handleOptionClick = useMemoizedFn((nextValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(nextValue)
    }
    onValueChange?.(nextValue)
  })

  return (
    <view className={className} style={style} {...containerProps}>
      {options.map((option) => {
        const selected = option.value === actualValue
        const disabled = option.disabled ?? false

        return (
          <view
            key={option.value}
            bindtap={() => {
              if (disabled) return
              handleOptionClick(option.value)
            }}
            className={clsx(optionClassName, {
              'ui-selected': selected,
              'ui-disabled': disabled,
            })}
            style={optionStyle}
            {...optionProps}
          >
            <text>{option.label}</text>
          </view>
        )
      })}
    </view>
  )
}
