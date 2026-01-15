// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  forwardRef,
  memo,
  runOnBackground,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
} from '@lynx-js/react'
import type { ForwardedRef } from '@lynx-js/react'

import { InvokeRejectError, setNativePropsByRef } from '@lynx-js/lynx-ui-common'
import type { NodesRef } from '@lynx-js/types'

import { KeyboardAwareTriggerContext } from './KeyboardAwareContext'
import type {
  InputBlurEvent,
  InputConfirmEvent,
  InputFocusEvent,
  InputInputEvent,
  InputSelectionEvent,
} from './NativeTypings'
import type {
  TextAreaProps,
  TextAreaRef,
  TextArea as TextAreaType,
} from './types'

export type { TextAreaRef, TextAreaProps }

export const TextArea = memo(forwardRef(TextAreaImpl)) as TextAreaType

function TextAreaImpl(props: TextAreaProps, ref: ForwardedRef<TextAreaRef>) {
  const {
    id,
    readonly = false,
    placeholder,
    lineSpacing,
    bounces = true,
    maxLines = 40,
    type = 'text',
    inputFilter,
    style,
    className,
    maxLength = 140,
    defaultValue,
    value,
    confirmType = 'send',
    showSoftInputOnFocus = true,
    onFocus,
    onInput,
    onConfirm,
    onBlur,
    onSelectionChange,
  } = props

  const controlled = useRef<boolean>(value !== undefined)

  const inputRef = useRef<NodesRef>(null)
  const { onInputBlurred, onInputFocused } = useContext(
    KeyboardAwareTriggerContext,
  )

  useEffect(() => {
    setValue(value ?? '')
  }, [value])

  useEffect(() => {
    if (!controlled.current) {
      setValue(defaultValue ?? '')
    }
  }, [])

  const focus = (): Promise<void> =>
    new Promise((resolve, reject) => {
      inputRef.current
        ?.invoke({
          method: 'focus',
          success: (_res) => {
            resolve()
          },
          fail: (res: { code: number, data: string }) => {
            reject(new InvokeRejectError(res.code, res.data))
          },
        })
        .exec()
    })

  const blur = (): Promise<void> =>
    new Promise((resolve, reject) => {
      inputRef.current
        ?.invoke({
          method: 'blur',
          success: (_res) => {
            resolve()
          },
          fail: (res: { code: number, data: string }) => {
            reject(new InvokeRejectError(res.code, res.data))
          },
        })
        .exec()
    })

  const setValue = (
    value: string,
  ): Promise<void> =>
    new Promise((resolve, reject) => {
      inputRef.current
        ?.invoke({
          method: 'setValue',
          params: {
            value,
          },
          success(_res) {
            resolve()
          },
          fail(res: { code: number, data: string }) {
            reject(new InvokeRejectError(res.code, res.data))
          },
        })
        .exec()
    })

  const getValue = (): Promise<
    { value: string, selectionStart: number, selectionEnd: number }
  > =>
    new Promise((resolve, reject) => {
      inputRef.current
        ?.invoke({
          method: 'getValue',
          success(
            _res: {
              value: string
              selectionStart: number
              selectionEnd: number
            },
          ) {
            resolve(_res)
          },
          fail(res: { code: number, data: string }) {
            reject(new InvokeRejectError(res.code, res.data))
          },
        })
        .exec()
    })

  const setSelectionRange = (
    selectionStart: number,
    selectionEnd: number,
  ): Promise<void> =>
    new Promise((resolve, reject) => {
      inputRef.current
        ?.invoke({
          method: 'setSelectionRange',
          params: {
            selectionStart,
            selectionEnd,
          },
          success(_res) {
            resolve()
          },
          fail(res: { code: number, data: string }) {
            reject(new InvokeRejectError(res.code, res.data))
          },
        })
        .exec()
    })

  const onInputDidFocused = (res: { detail: InputFocusEvent }) => {
    onInputFocused?.()
    onFocus?.(res.detail.value)
  }

  const onInputDidBlurred = (res: { detail: InputBlurEvent }) => {
    onInputBlurred?.()
    onBlur?.(res.detail.value)
  }

  const onInputDidConfirm = (res: { detail: InputConfirmEvent }) => {
    onConfirm?.(res.detail.value)
  }

  const onInputSelectionDidChanged = (res: { detail: InputSelectionEvent }) => {
    onSelectionChange?.(res.detail.selectionStart, res.detail.selectionEnd)
  }

  const sendInputEvent = (
    value: string,
    selectionStart: number,
    selectionEnd: number,
    isComposing: boolean,
    unlockInteraction = false,
  ) => {
    onInput?.(value, selectionStart, selectionEnd, isComposing)
    if (unlockInteraction) {
      setNativePropsByRef(inputRef, { readonly: false })
    }
  }

  const onInputContentDidChanged = (res: { detail: InputInputEvent }) => {
    'main thread'
    if (controlled.current) {
      // @ts-expect-error TODO: fix the typings of MTS
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      res.currentTarget.setAttribute('readonly', true)
    }
    runOnBackground(sendInputEvent)(
      res.detail.value,
      res.detail.selectionStart,
      res.detail.selectionEnd,
      res.detail.isComposing,
      controlled.current,
    )
  }

  useImperativeHandle(
    ref,
    () => ({
      setValue,
      getValue,
      blur,
      focus,
      setSelectionRange,
    }),
    [setValue, getValue, blur, focus, setSelectionRange],
  )

  return (
    <textarea
      ref={inputRef}
      id={id}
      readonly={readonly}
      line-spacing={lineSpacing}
      bounces={bounces}
      maxlines={maxLines}
      ignore-focus={true}
      placeholder={placeholder}
      confirm-type={confirmType}
      // @ts-expect-error TODO: update type-lynx
      type={type}
      input-filter={inputFilter}
      maxlength={maxLength}
      show-soft-input-on-focus={showSoftInputOnFocus}
      main-thread:bindinput={onInputContentDidChanged}
      bindfocus={onInputDidFocused}
      bindblur={onInputDidBlurred}
      bindconfirm={onInputDidConfirm}
      bindselection={onInputSelectionDidChanged}
      className={className}
      style={style}
    />
  )
}
