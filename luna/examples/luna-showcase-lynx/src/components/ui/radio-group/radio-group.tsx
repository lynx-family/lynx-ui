// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useRef, useState } from '@lynx-js/react'
import type { ReactNode } from '@lynx-js/react'

import { RadioGroupProvider, useRadioGroup } from './context'
import { cn } from '../../../utils'

interface RadioItemProps {
  size?: 'sm' | 'md'
  disabled?: boolean
  value: string
  className?: string
}

interface RadioGroupProps {
  className?: string
  disabled?: boolean
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children?: ReactNode
}

interface HitSlop {
  top: `${number}px`
  left: `${number}px`
  right: `${number}px`
  bottom: `${number}px`
}

const hitSlopLg: HitSlop = {
  top: '8px',
  left: '8px',
  right: '8px',
  bottom: '8px',
}
const hitSlopSM: HitSlop = {
  top: '10px',
  left: '10px',
  right: '10px',
  bottom: '10px',
}

function RadioItem(
  { disabled: disabledProp, value, size = 'sm', className }: RadioItemProps,
) {
  const { selectedValue, handleValueChange, disabled: groupDisabled } =
    useRadioGroup()

  const disabled = groupDisabled || disabledProp

  const handleChange = () => {
    if (disabled) return
    handleValueChange(value)
  }

  return (
    <view
      className={cn(
        'border-line rounded-full border-[1.5px] ui-checked:border-none ui-checked:bg-primary ui-disabled:opacity-40 active:opacity-80',
        size === 'sm' ? 'size-[16px]' : 'size-[22px]',
        disabled && 'ui-disabled',
        selectedValue === value && 'ui-checked',
        'ui-checked:active:bg-primary-2',
        className,
      )}
      bindtap={handleChange}
      hit-slop={size === 'sm' ? hitSlopSM : hitSlopLg}
    >
      {/* Indicator */}
      <view className={'size-full flex justify-center items-center'}>
        {selectedValue === value
          && (
            <view
              className={cn(
                'bg-primary-content rounded-full',
                size === 'sm' ? 'size-[6px]' : 'size-[9px]',
              )}
            />
          )}
      </view>
    </view>
  )
}

function RadioGroup(
  {
    disabled = false,
    onValueChange,
    defaultValue,
    children,
    className,
    value: valueProp,
  }: RadioGroupProps,
) {
  const isControlled = valueProp !== undefined
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)

  const lastValueRef = useRef<string>()

  const value = isControlled ? valueProp : uncontrolledValue

  const handleValueChange = (value: string) => {
    if (disabled) return
    if (lastValueRef.current !== value) {
      lastValueRef.current = value
      if (!isControlled) {
        setUncontrolledValue(value)
      }
      onValueChange?.(value)
    }
  }

  return (
    <RadioGroupProvider
      handleValueChange={handleValueChange}
      selectedValue={value}
      disabled={disabled}
    >
      <view className={cn('grid gap-[10px]', className)}>
        {children}
      </view>
    </RadioGroupProvider>
  )
}

export { RadioGroup, RadioItem }
