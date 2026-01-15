// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from '@lynx-js/react'
import type { ReactNode } from '@lynx-js/react'

import { Button, ButtonContext } from '@lynx-js/lynx-ui-button'
import { noop, useMemoizedFn } from '@lynx-js/lynx-ui-common'
import { clsx } from 'clsx'

import type {
  RadioGroupRenderProps,
  RadioGroupRootProps,
  RadioIndicatorProps,
  RadioProps,
} from './types'

const RadioGroupContext = createContext<{
  selectedValue: string | null
  disabled: boolean
  handleValueChange: (radioValue: string) => void
}>({
  selectedValue: null,
  disabled: false,
  handleValueChange: noop,
})

export const RadioGroupRoot = (props: RadioGroupRootProps): ReactNode => {
  const {
    children,
    onValueChange,
    defaultValue,
    value,
    disabled = false,
  } = props

  const isControlled = value !== undefined
  const [uncontrolledValue, setUncontrolledValue] = useState<string | null>(
    defaultValue ?? null,
  )
  const actualValue = isControlled ? value : uncontrolledValue

  const lastValue = useRef<string | null>(null)
  const sendOnValueChangeEvent = useMemoizedFn((value: string) => {
    if (lastValue.current !== value) {
      onValueChange?.(value)
      lastValue.current = value
    }
  })

  const handleValueChange = useCallback((value: string) => {
    if (!isControlled) {
      setUncontrolledValue(value)
    }
    sendOnValueChangeEvent(value)
  }, [isControlled, sendOnValueChangeEvent])

  useEffect(() => {
    sendOnValueChangeEvent(value ?? '')
  }, [value, sendOnValueChangeEvent])

  const radioGroupContextValue = useMemo(
    () => ({ selectedValue: actualValue, handleValueChange, disabled }),
    [actualValue, handleValueChange, disabled],
  )

  const renderChildren = useMemo(() => {
    const status: RadioGroupRenderProps = { value: actualValue, disabled }
    return typeof children === 'function'
      ? children(status)
      : children
  }, [children, actualValue])

  return (
    <RadioGroupContext.Provider
      value={radioGroupContextValue}
    >
      {renderChildren}
    </RadioGroupContext.Provider>
  )
}

const RadioContext = createContext<{ value: string, disabled: boolean }>({
  value: '',
  disabled: false,
})

export const Radio = (props: RadioProps): ReactNode => {
  const {
    className,
    disabled = false,
    style,
    value,
    children,
    radioProps,
  } = props

  const radioGroupContext = useContext(RadioGroupContext)
  if (!radioGroupContext) {
    throw new Error('<Radio/> must be used within <RadioGroup/>!')
  }
  const { selectedValue, disabled: groupDisabled, handleValueChange } =
    radioGroupContext
  const isEffectiveDisabled = disabled || groupDisabled
  const checked = value === selectedValue
  const RadioContextValue = useMemo(
    () => ({ value, disabled: isEffectiveDisabled }),
    [value, isEffectiveDisabled],
  )
  const handleChange = useMemoizedFn(() => (handleValueChange(value)))

  return (
    <RadioContext.Provider value={RadioContextValue}>
      <Button
        className={clsx(
          className,
          {
            'ui-checked': checked,
          },
        )}
        style={style}
        disabled={isEffectiveDisabled}
        onClick={handleChange}
        buttonProps={radioProps}
      >
        {children}
      </Button>
    </RadioContext.Provider>
  )
}

export const RadioIndicator = (props: RadioIndicatorProps): ReactNode => {
  const { className, style, children, forceMount = false } = props
  const { selectedValue } = useContext(
    RadioGroupContext,
  )
  const { value, disabled } = useContext(RadioContext)
  const { active } = useContext(ButtonContext)
  const checked = value === selectedValue

  return (
    <view
      className={clsx(
        className,
        {
          'ui-checked': checked,
          'ui-disabled': disabled,
          'ui-active': active,
        },
      )}
      style={style}
    >
      {(forceMount || checked) && children}
    </view>
  )
}
