// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ForwardedRef, ReactElement, ReactNode } from '@lynx-js/react'

import type { ComponentBasicProps } from '@lynx-js/lynx-ui-common'
import type {
  ScrollViewProps,
  ScrollViewRef,
} from '@lynx-js/lynx-ui-scroll-view'
import type { CSSProperties } from '@lynx-js/types'

export type Input = (props: InputProps) => ReactElement

export interface InputRef {
  /**
   * Set input content
   * @zh 设置输入框内容
   * @Android
   * @iOS
   * @Harmony
   */
  setValue: (
    /**
     * The input content
     * @Android
     * @iOS
     * @Harmony
     */
    value: string,
  ) => Promise<void>
  /**
   * Require focus
   * @zh 聚焦输入框
   * @Android
   * @iOS
   * @Harmony
   * @Web
   */
  focus: () => Promise<void>
  /**
   * Release focus
   * @zh 释放输入框焦点
   * @Android
   * @iOS
   * @Harmony
   * @Web
   */
  blur: () => Promise<void>
  /**
   * Get input content
   * @zh 获取输入框内容
   * @Android
   * @iOS
   * @Harmony
   * @Web
   */
  getValue: () => Promise<{
    value: string
    selectionStart: number
    selectionEnd: number
  }>
  /**
   * Set selection range
   * @zh 设置输入框选中范围
   * @Android
   * @iOS
   * @Harmony
   * @Web
   */
  setSelectionRange: (
    /**
     * Start position of the selection
     * @zh 选中范围开始位置
     * @Android
     * @iOS
     * @Harmony
     */
    selectionStart: number,
    /**
     * Start position of the selection
     * @zh 选中范围结束位置
     * @Android
     * @iOS
     * @Harmony
     */
    selectionEnd: number,
  ) => Promise<void>
}

export interface InputProps extends ComponentBasicProps {
  ref?: ForwardedRef<InputRef>
  /**
   * The value of the input
   * @zh 输入框默认值
   * @since 3.5
   * @Android
   * @iOS
   * @Harmony
   */
  defaultValue?: string
  /**
   * The controlled value of the input
   * @zh 输入框受控值
   * @since 3.5
   * @Android
   * @iOS
   * @Harmony
   */
  value?: string
  /**
   * The id of the input
   * @zh 输入框 id
   * @defaultValue 'input'
   * @Android
   * @iOS
   * @Harmony
   */
  id?: string
  /**
   * Placeholder
   * @zh 输入框占位符
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 3.2
   */
  placeholder?: string
  /**
   * The type of confirm button
   * @zh 输入框确认按钮类型
   * @defaultValue 'send'
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 2.16
   */
  confirmType?: 'send' | 'search' | 'go' | 'done' | 'next'
  /**
   * Max input length
   * @zh 输入框最大长度
   * @defaultValue 140
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 2.16
   */
  maxLength?: number
  /**
   * Interaction enabled
   * @zh 输入框是否可交互
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 2.16
   */
  readonly?: boolean
  /**
   * Show soft input keyboard while focused
   * @zh 输入框是否聚焦时显示软键盘
   * @defaultValue true
   * @Android
   * @iOS
   * @Harmony
   * @since 2.16
   */
  showSoftInputOnFocus?: boolean

  /**
   * Filter the input content and process it in the form of regular expressions
   * @zh 输入框内容过滤正则表达式
   * @defaultValue undefined
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 2.18
   */
  inputFilter?: string

  /**
   * Input content type
   * @zh 输入框内容类型
   * @defaultValue "text"
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 2.16
   */
  type?: 'text' | 'number' | 'digit' | 'password' | 'tel' | 'email'

  /**
   * Focused
   * @zh 输入框聚焦事件
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 2.16
   */
  onFocus?: (
    /**
     * Input content
     * @zh 输入框聚焦时的内容
     * @Android
     * @iOS
     * @Harmony
     * @Web
     * @since 3.2
     */
    value: string,
  ) => void

  /**
   * Blurred
   * @zh 输入框失焦事件
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 2.16
   */
  onBlur?: (
    /**
     * Input content
     * @zh 输入框失焦时的内容
     * @Android
     * @iOS
     * @Harmony
     * @Web
     * @since 3.2
     */
    value: string,
  ) => void

  /**
   * Confirm button clicked
   * @zh 输入框确认按钮点击事件
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 2.16
   */
  onConfirm?: (
    /**
     * Input content
     * @zh 输入框确认按钮点击时的内容
     * @Android
     * @iOS
     * @Harmony
     * @Web
     * @since 3.2
     */
    value: string,
  ) => void
  /**
   * Input content changed
   * @zh 输入框内容改变事件
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 2.16
   */
  onInput?: (
    /**
     * Input content
     * @zh 输入框内容改变时的内容
     * @Android
     * @iOS
     * @Harmony
     * @Web
     * @since 2.16
     */
    value: string,
    /**
     * The start position of the selection
     * @zh 输入框内容改变时的选择起始位置
     * @Android
     * @iOS
     * @Harmony
     * @Web
     * @since 2.16
     */
    selectionStart: number,
    /**
     * The end position of the selection
     * @zh 输入框内容改变时的选择结束位置
     * @Android
     * @iOS
     * @Harmony
     * @Web
     * @since 2.16
     */
    selectionEnd: number,
    /**
     * Is composing or not
     * @zh 输入框内容改变时是否正在组合输入
     * @iOS
     * @Android
     * @Harmony
     * @Web
     * @since 2.16
     */
    isComposing?: boolean,
  ) => void

  /**
   * Input selection changed
   * @zh 输入框选择范围改变事件
   * @Android
   * @iOS
   * @Harmony
   * @Web
   * @since 2.16
   */
  onSelectionChange?: (
    /**
     * The start position of the selection
     * @zh 输入框选择范围改变时的选择起始位置
     * @Android
     * @iOS
     * @Harmony
     * @Web
     * @since 2.16
     */
    selectionStart: number,
    /**
     * The end position of the selection
     * @zh 输入框选择范围改变时的选择结束位置
     * @Android
     * @iOS
     * @Harmony
     * @Web
     * @since 2.16
     */
    selectionEnd: number,
  ) => void
}

export type TextArea = (props: TextAreaProps) => ReactElement

export interface TextAreaRef extends InputRef {}

export interface TextAreaProps extends Omit<InputProps, 'ref'> {
  ref?: ForwardedRef<TextAreaRef>
  /**
   * Bounce effect for iOS
   * @zh 输入框是否开启 iOS  bounces 效果
   * @defaultValue true
   * @iOS
   * @since 3.4
   */
  bounces?: boolean
  /**
   * Max input lines
   * @zh 输入框最大输入行数
   * @defaultValue 40
   * @Android
   * @iOS
   * @Harmony
   * @since 3.4
   */
  maxLines?: number
  /**
   * Line spacing
   * @zh 输入框行间距
   * @iOS
   * @Android
   * @since 3.4
   */
  lineSpacing?: number | `${number}px` | `${number}rpx`
}

export type KeyboardAwareTrigger = (
  props: KeyboardAwareTriggerProps,
) => ReactElement

export interface KeyboardAwareTriggerProps extends ComponentBasicProps {
  /**
   * Children
   * @zh 输入框键盘感知组件的子元素
   * @Android
   * @iOS
   * @Harmony
   */
  children: ReactNode
  /**
   * Additional Offset, in px
   * @zh 输入框键盘感知组件的额外偏移量, 单位是 px
   * @defaultValue 0
   * @Android
   * @iOS
   * @Harmony
   */
  offset?: number
}

export interface KeyboardAwareResponderRef extends ScrollViewRef {
  as: () => 'View' | 'ScrollView'
}

export type KeyboardAwareResponder = (
  props: KeyboardAwareResponderProps,
) => ReactElement

export interface KeyboardAwareResponderProps
  extends Omit<ScrollViewProps, 'ref' | 'horizontal' | 'style'>
{
  ref?: ForwardedRef<KeyboardAwareResponderRef>
  /**
   * The type of the root component
   * @zh 输入框键盘响应组件的根元素类型
   * @defaultValue 'View'
   * @Android
   * @iOS
   * @Harmony
   */
  as?: 'View' | 'ScrollView'
  /**
   * Styles for `KeyboardAwareResponder`
   * `KeyboardAwareResponder` 的样式
   * @Android
   * @iOS
   */
  style?: CSSProperties
}

export type KeyboardAwareRoot = (props: KeyboardAwareRootProps) => ReactElement

export interface KeyboardAwareRootProps {
  /**
   * The height of the Android status bar and bottom navigation bar needs to be set. If your App has an immersive status bar, only the height of the bottom navigation bar needs to be passed in. In px.
   * @zh 需要设置 Android 状态栏高度和底部导航栏的高度，如果是沉浸式状态栏，则只需传入底部导航栏的高度
   * @defaultValue 0
   * @Android
   */
  androidStatusBarPlusBottomBarHeight?: number
  /**
   * Whether to force attach the root component
   * @zh 是否强制吸附到键盘上方
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   */
  forceAttach?: boolean
  /**
   * Children
   * @zh 输入框键盘响应组件的子元素
   * @Android
   * @iOS
   * @Harmony
   */
  children: ReactNode
}
