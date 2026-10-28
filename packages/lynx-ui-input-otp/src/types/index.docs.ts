// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ForwardedRef, ReactNode } from '@lynx-js/react'

import type { ComponentBasicProps } from '@lynx-js/lynx-ui-common'

/**
 * Positive number of slots managed by InputOTP.
 * @zh InputOTP 管理的输入槽数量，必须为正整数。
 */
export type InputOTPLength = number

/**
 * Character set accepted by InputOTP.
 * @zh InputOTP 接受的字符集。
 */
export type InputOTPInputType =
  | 'alphabetic'
  | 'numeric'
  | 'alphanumeric'

/**
 * State exposed to an InputOTP render function.
 * @zh 暴露给 InputOTP 渲染函数的状态。
 */
export interface InputOTPRenderProps {
  /**
   * The normalized OTP or PIN value.
   * @zh 规范化后的 OTP 或 PIN 值。
   */
  value: string

  /**
   * The configured field length.
   * @zh 配置的输入长度。
   */
  length: InputOTPLength

  /**
   * The configured input character set.
   * @zh 配置的输入字符集。
   */
  inputType: InputOTPInputType

  /**
   * Whether the hidden native input is focused.
   * @zh 隐藏的原生输入框是否聚焦。
   */
  focused: boolean

  /**
   * Whether every slot is filled.
   * @zh 是否所有输入槽均已填充。
   */
  complete: boolean

  /**
   * Whether input is disabled.
   * @zh 输入是否已禁用。
   */
  disabled: boolean

  /**
   * Whether the field is invalid.
   * @zh 输入是否处于无效状态。
   */
  invalid: boolean
}

/**
 * State exposed to an InputOTPSlot render function.
 * @zh 暴露给 InputOTPSlot 渲染函数的状态。
 */
export interface InputOTPSlotRenderProps {
  /**
   * Zero-based slot index.
   * @zh 从零开始的输入槽索引。
   */
  index: number

  /**
   * Character displayed by this slot.
   * @zh 当前输入槽展示的字符。
   */
  char?: string

  /**
   * Whether this is the focused slot that contains the visual caret.
   * @zh 当前输入槽是否为包含可视光标的聚焦槽。
   */
  focused: boolean

  /**
   * Whether this slot contains a character.
   * @zh 当前输入槽是否已经包含字符。
   */
  filled: boolean

  /**
   * Whether every slot in the field is filled.
   * @zh 当前输入框中的所有输入槽是否均已填充。
   */
  complete: boolean

  /**
   * Whether input is disabled.
   * @zh 输入是否已禁用。
   */
  disabled: boolean

  /**
   * Whether the field is invalid.
   * @zh 输入是否处于无效状态。
   */
  invalid: boolean
}

/**
 * UI variants injected by InputOTP for state-based styling.
 * @zh InputOTP 注入的 UI variants，可用于按状态定制样式。
 */
export interface InputOTPUIVariants {
  /**
   * Applied to the root while the hidden input is focused.
   * @zh 隐藏输入框聚焦时应用于根节点。
   */
  'ui-focused'?: boolean

  /**
   * Applied to the root when every slot is filled.
   * @zh 所有输入槽均已填充时应用于根节点。
   */
  'ui-complete'?: boolean

  /**
   * Applied to the root while input is disabled.
   * @zh 禁用输入时应用于根节点。
   */
  'ui-disabled'?: boolean

  /**
   * Applied to the root while the value is invalid.
   * @zh 输入值无效时应用于根节点。
   */
  'ui-invalid'?: boolean
}

/**
 * UI variants injected by InputOTPSlot for state-based styling.
 * @zh InputOTPSlot 注入的 UI variants，可用于按状态定制样式。
 */
export interface InputOTPSlotUIVariants {
  /**
   * Applied to the slot that contains the visual caret.
   * @zh 应用于包含可视光标的输入槽。
   */
  'ui-focused'?: boolean

  /**
   * Applied to slots that contain a character.
   * @zh 应用于已经包含字符的输入槽。
   */
  'ui-filled'?: boolean

  /**
   * Applied to every slot when the field is complete.
   * @zh 输入完成时应用于每个输入槽。
   */
  'ui-complete'?: boolean

  /**
   * Applied to the slot while input is disabled.
   * @zh 禁用输入时应用于输入槽。
   */
  'ui-disabled'?: boolean

  /**
   * Applied to the slot while the value is invalid.
   * @zh 输入值无效时应用于输入槽。
   */
  'ui-invalid'?: boolean
}

/**
 * Imperative methods exposed by InputOTP.
 * @zh InputOTP 暴露的命令式方法。
 */
export interface InputOTPRef {
  /**
   * Focus the hidden native input and show the configured keyboard.
   * @zh 聚焦隐藏的原生输入框并唤起配置的键盘。
   * @Android
   * @iOS
   * @Harmony
   */
  focus: () => Promise<void>

  /**
   * Blur the hidden native input and dismiss the keyboard.
   * @zh 让隐藏的原生输入框失焦并收起键盘。
   * @Android
   * @iOS
   * @Harmony
   */
  blur: () => Promise<void>

  /**
   * Replace the current uncontrolled value. In controlled mode, this requests
   * the next value through onChange and the value prop remains authoritative.
   * Unsupported characters are discarded.
   * @zh 替换当前非受控值。在受控模式下，该方法通过 onChange 请求新值，
   * value 属性仍是唯一数据源。不支持的字符会被丢弃。
   * @Android
   * @iOS
   * @Harmony
   */
  setValue: (value: string) => Promise<void>

  /**
   * Clear the current uncontrolled value. In controlled mode, update the
   * value prop from the onChange callback.
   * @zh 清空当前非受控值。在受控模式下，请通过 onChange 回调更新 value 属性。
   * @Android
   * @iOS
   * @Harmony
   */
  clear: () => Promise<void>

  /**
   * Return the currently displayed value.
   * @zh 返回当前展示的值。
   * @Android
   * @iOS
   * @Harmony
   */
  getValue: () => string
}

/**
 * Props for InputOTP.
 * @zh InputOTP 属性。
 */
export interface InputOTPProps extends ComponentBasicProps {
  ref?: ForwardedRef<InputOTPRef>

  /**
   * Positive number of OTP or PIN characters. Invalid values fall back to 6.
   * @defaultValue 6
   * @zh OTP 或 PIN 字符数，必须为正整数。无效值会回退为 6。
   * @Android
   * @iOS
   * @Harmony
   */
  length?: InputOTPLength

  /**
   * Character set accepted by the hidden native input.
   * @defaultValue "numeric"
   * @zh 隐藏的原生输入框接受的字符集。
   * @Android
   * @iOS
   * @Harmony
   */
  inputType?: InputOTPInputType

  /**
   * Controlled value. Characters outside inputType are discarded.
   * @zh 受控值；不符合 inputType 的字符会被丢弃。
   * @Android
   * @iOS
   * @Harmony
   */
  value?: string

  /**
   * Initial value in uncontrolled mode.
   * @zh 非受控模式下的初始值。
   * @Android
   * @iOS
   * @Harmony
   */
  defaultValue?: string

  /**
   * Focus the hidden input after mounting.
   * @defaultValue false
   * @zh 挂载后自动聚焦隐藏输入框。
   * @Android
   * @iOS
   * @Harmony
   */
  autoFocus?: boolean

  /**
   * Disable keyboard input and focus.
   * @defaultValue false
   * @zh 禁用键盘输入和聚焦。
   * @Android
   * @iOS
   * @Harmony
   */
  disabled?: boolean

  /**
   * Expose the invalid state to render props and the `ui-invalid` UI variant.
   * @defaultValue false
   * @zh 通过渲染属性和 `ui-invalid` UI variant 暴露无效状态。
   * @Android
   * @iOS
   * @Harmony
   */
  invalid?: boolean

  /**
   * InputOTPSlot children, or a render function receiving the field state.
   * InputOTP does not create slots automatically.
   * @zh InputOTPSlot 子节点，或接收输入状态的渲染函数。InputOTP
   * 不会自动创建输入槽。
   * @docTypeFallback ReactNode | ((state: InputOTPRenderProps) => ReactNode)
   * @Android
   * @iOS
   * @Harmony
   */
  children?:
    | ReactNode
    | ((state: InputOTPRenderProps) => ReactNode)

  /**
   * Called after the normalized value changes.
   * @zh 规范化后的值变化时触发。
   * @Android
   * @iOS
   * @Harmony
   */
  onChange?: (value: string) => void

  /**
   * Called when the value transitions from incomplete to complete.
   * @zh 输入值从未完成变为完整时触发。
   * @Android
   * @iOS
   * @Harmony
   */
  onComplete?: (value: string) => void

  /**
   * Called when the hidden input gains focus.
   * @zh 隐藏输入框聚焦时触发。
   * @Android
   * @iOS
   * @Harmony
   */
  onFocus?: () => void

  /**
   * Called when the hidden input loses focus.
   * @zh 隐藏输入框失焦时触发。
   * @Android
   * @iOS
   * @Harmony
   */
  onBlur?: () => void
}

/**
 * Props for an individual InputOTP visual slot.
 * @zh 单个 InputOTP 可视输入槽的属性。
 */
export interface InputOTPSlotProps extends ComponentBasicProps {
  /**
   * Zero-based index used to read the corresponding InputOTP character.
   * @zh 从零开始的索引，用于读取 InputOTP 中对应的字符。
   * @Android
   * @iOS
   * @Harmony
   */
  index: number

  /**
   * Custom slot content. A render function receives the slot state.
   * When omitted, InputOTPSlot renders its character and visual caret.
   * @zh 自定义输入槽内容。渲染函数会接收输入槽状态。省略时，
   * InputOTPSlot 会渲染默认字符和可视光标。
   * @docTypeFallback ReactNode | ((state: InputOTPSlotRenderProps) => ReactNode)
   * @Android
   * @iOS
   * @Harmony
   */
  children?:
    | ReactNode
    | ((state: InputOTPSlotRenderProps) => ReactNode)
}
