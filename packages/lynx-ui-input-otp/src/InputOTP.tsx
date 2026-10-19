// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  forwardRef,
  memo,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from '@lynx-js/react'
import type { ForwardedRef, ReactElement } from '@lynx-js/react'

import { InvokeRejectError, useMemoizedFn } from '@lynx-js/lynx-ui-common'
import { KeyboardAwareTriggerContext } from '@lynx-js/lynx-ui-input'
import type {
  BaseEvent,
  CSSProperties,
  InputBlurEvent,
  InputFocusEvent,
  InputInputEvent,
  NodesRef,
} from '@lynx-js/types'
import { clsx } from 'clsx'

import { InputOTPContext } from './InputOTPContext'
import type { InputOTPProps, InputOTPRef, InputOTPRenderProps } from './types'
import {
  nativeInputFilters,
  normalizeInputOTPLength,
  normalizeOTPValue,
} from './utils'

type InputOTPComponent = (props: InputOTPProps) => ReactElement

const hiddenInputStyle: CSSProperties = {
  position: 'absolute',
  top: '0px',
  left: '0px',
  width: '1px',
  height: '1px',
  padding: '0px',
  borderWidth: '0px',
  opacity: 0,
  color: 'transparent',
  caretColor: 'transparent',
  backgroundColor: 'transparent',
}

export const InputOTP = memo(forwardRef(InputOTPImpl)) as InputOTPComponent

function reportInputError(error: unknown) {
  console.warn(
    `[lynx-ui-input-otp][InputOTP] native input command failed: ${
      String(error)
    }`,
  )
}

function InputOTPImpl(
  props: InputOTPProps,
  ref: ForwardedRef<InputOTPRef>,
) {
  const {
    length = 6,
    inputType = 'numeric',
    value,
    defaultValue = '',
    autoFocus = false,
    disabled = false,
    invalid = false,
    className,
    style,
    children,
    onChange,
    onComplete,
    onFocus,
    onBlur,
  } = props

  const fieldLength = normalizeInputOTPLength(length)
  const isControlled = value !== undefined
  const [uncontrolledValue, setUncontrolledValue] = useState(
    normalizeOTPValue(defaultValue, fieldLength, inputType),
  )
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<NodesRef>(null)
  const { onInputBlurred, onInputFocused } = useContext(
    KeyboardAwareTriggerContext,
  )

  const displayedValue = normalizeOTPValue(
    isControlled ? value : uncontrolledValue,
    fieldLength,
    inputType,
  )

  const invokeInput = useMemoizedFn(
    (
      method: 'focus' | 'blur' | 'setValue',
      nextValue?: string,
    ): Promise<void> =>
      new Promise((resolve, reject) => {
        if (!inputRef.current) {
          reject(new Error('InputOTP input is not mounted.'))
          return
        }

        inputRef.current
          .invoke({
            method,
            ...(method === 'setValue'
              ? {
                params: {
                  value: nextValue ?? '',
                },
              }
              : {}),
            success: () => {
              resolve()
            },
            fail: (result: { code: number, data: string }) => {
              reject(new InvokeRejectError(result.code, result.data))
            },
          })
          .exec()
      }),
  )

  const focus = useMemoizedFn(() =>
    disabled ? Promise.resolve() : invokeInput('focus')
  )

  const blur = useMemoizedFn(() => invokeInput('blur'))

  const syncNativeValue = useMemoizedFn(
    (nextValue: string) => invokeInput('setValue', nextValue),
  )

  const emitValue = useMemoizedFn(
    (nextValue: string, previousValue: string) => {
      if (nextValue === previousValue) {
        return
      }

      onChange?.(nextValue)

      if (
        nextValue.length === fieldLength
        && previousValue.length !== fieldLength
      ) {
        onComplete?.(nextValue)
      }
    },
  )

  const setValue = useMemoizedFn((nextRawValue: string) => {
    const nextValue = normalizeOTPValue(
      nextRawValue,
      fieldLength,
      inputType,
    )

    if (!isControlled) {
      setUncontrolledValue(nextValue)
    }

    emitValue(nextValue, displayedValue)

    return syncNativeValue(nextValue)
  })

  useImperativeHandle(
    ref,
    () => ({
      focus,
      blur,
      setValue,
      clear: () => setValue(''),
      getValue: () => displayedValue,
    }),
    [blur, displayedValue, focus, setValue],
  )

  useEffect(() => {
    if (isControlled) {
      return
    }

    const nextValue = normalizeOTPValue(
      uncontrolledValue,
      fieldLength,
      inputType,
    )

    if (nextValue !== uncontrolledValue) {
      setUncontrolledValue(nextValue)
    }
  }, [fieldLength, inputType, isControlled, uncontrolledValue])

  useEffect(() => {
    void syncNativeValue(displayedValue).catch(reportInputError)
  }, [displayedValue, syncNativeValue])

  useEffect(() => {
    if (autoFocus && !disabled) {
      void focus().catch(reportInputError)
    }
  }, [autoFocus, disabled, focus])

  const handleInput = useMemoizedFn(
    (event: BaseEvent<'bindinput', InputInputEvent>) => {
      const rawValue = event.detail.value
      const nextValue = normalizeOTPValue(rawValue, fieldLength, inputType)

      if (!isControlled) {
        setUncontrolledValue(nextValue)
      }

      emitValue(nextValue, displayedValue)

      if (rawValue !== nextValue) {
        void syncNativeValue(nextValue).catch(reportInputError)
      }
    },
  )

  const handleFocus = useMemoizedFn(
    (_event: BaseEvent<'bindfocus', InputFocusEvent>) => {
      setFocused(true)
      onInputFocused?.()
      onFocus?.()
    },
  )

  const handleBlur = useMemoizedFn(
    (_event: BaseEvent<'bindblur', InputBlurEvent>) => {
      setFocused(false)
      onInputBlurred?.()
      onBlur?.()
    },
  )

  const handleTap = useMemoizedFn(() => {
    if (!disabled) {
      void focus().catch(reportInputError)
    }
  })

  const contextValue = useMemo<InputOTPRenderProps>(() => ({
    value: displayedValue,
    length: fieldLength,
    inputType,
    focused,
    complete: displayedValue.length === fieldLength,
    disabled,
    invalid,
  }), [
    disabled,
    displayedValue,
    fieldLength,
    focused,
    inputType,
    invalid,
  ])

  const renderedChildren = typeof children === 'function'
    ? children(contextValue)
    : children

  return (
    <InputOTPContext.Provider value={contextValue}>
      <view
        bindtap={handleTap}
        className={clsx(className, {
          'ui-focused': focused,
          'ui-complete': contextValue.complete,
          'ui-disabled': disabled,
          'ui-invalid': invalid,
        })}
        flatten={false}
        style={style}
      >
        {renderedChildren}
        <input
          ref={inputRef}
          android-fullscreen-mode={false}
          bindblur={handleBlur}
          bindfocus={handleFocus}
          bindinput={handleInput}
          confirm-type='done'
          disabled={disabled}
          ignore-focus={true}
          input-filter={nativeInputFilters[inputType]}
          ios-auto-correct={false}
          ios-spell-check={false}
          maxlength={fieldLength}
          show-soft-input-on-focus={true}
          style={hiddenInputStyle}
          type={inputType === 'numeric' ? 'number' : 'text'}
        />
      </view>
    </InputOTPContext.Provider>
  )
}
