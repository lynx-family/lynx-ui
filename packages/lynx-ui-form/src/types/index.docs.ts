// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import type { ButtonProps } from '@lynx-js/lynx-ui-button'
import type { CheckboxProps } from '@lynx-js/lynx-ui-checkbox'
import type { InputProps, TextAreaProps } from '@lynx-js/lynx-ui-input'
import type { RadioGroupRootProps } from '@lynx-js/lynx-ui-radio-group'
import type { SwitchProps } from '@lynx-js/lynx-ui-switch'

export interface FormRootProps {
  /**
   * The content of the form.
   * @zh 表单内容
   * @iOS
   * @Android
   * @Harmony
   */
  children: ReactNode
  /**
   * The initial values of the form fields.
   * @zh 表单字段的初始值
   * @iOS
   * @Android
   * @Harmony
   */
  initialValues?: Record<string, unknown>
  /**
   * Callback function triggered when the form is submitted.
   * @zh 表单提交时触发的回调函数
   * @iOS
   * @Android
   * @Harmony
   */
  onSubmit?: (values: Record<string, unknown>) => void
  /**
   * Callback function triggered when any field's value changes. It receives the entire form's data.
   * @zh 任意字段值变化时触发的回调函数，接收整个表单的数据
   * @iOS
   * @Android
   * @Harmony
   */
  onChanged?: (values: Record<string, unknown>) => void
}

export interface FormFieldBaseProps {
  /**
   * The unique identifier for the form field.
   * @zh 表单字段的唯一标识符
   * @iOS
   * @Android
   * @Harmony
   */
  name: string
  /**
   * The child elements of the form field, usually used for labels or complex structures.
   * @zh 表单字段的子节点，通常用于标签或复杂结构
   * @iOS
   * @Android
   * @Harmony
   */
  children?: ReactNode
  /**
   * Callback function triggered when this specific field's value changes.
   * @zh 当前字段值变化时触发的回调函数
   * @iOS
   * @Android
   * @Harmony
   */
  onChanged?: (value: unknown) => void
}

export interface FormFieldAsInput
  extends
    FormFieldBaseProps,
    Omit<InputProps, 'defaultValue' | 'value' | 'onInput'>
{
  /**
   * Specifies the type of component to render.
   * @zh 指定渲染的组件类型
   * @iOS
   * @Android
   * @Harmony
   */
  as: 'Input'
}

export interface FormFieldAsTextArea
  extends
    FormFieldBaseProps,
    Omit<TextAreaProps, 'defaultValue' | 'value' | 'onInput'>
{
  /**
   * Specifies the type of component to render.
   * @zh 指定渲染的组件类型
   * @iOS
   * @Android
   * @Harmony
   */
  as: 'TextArea'
}

export interface FormFieldAsRadioGroup extends
  FormFieldBaseProps,
  Omit<
    RadioGroupRootProps,
    'defaultValue' | 'value' | 'onValueChange' | 'children'
  >
{
  /**
   * Specifies the type of component to render.
   * @zh 指定渲染的组件类型
   * @iOS
   * @Android
   * @Harmony
   */
  as: 'RadioGroupRoot'
}

export interface FormFieldAsCheckbox
  extends
    Omit<FormFieldBaseProps, 'children'>,
    Omit<CheckboxProps, 'defaultChecked' | 'checked' | 'onChange'>
{
  /**
   * Specifies the type of component to render.
   * @zh 指定渲染的组件类型
   * @iOS
   * @Android
   * @Harmony
   */
  as: 'Checkbox'
}

export interface FormFieldAsSwitch
  extends
    Omit<FormFieldBaseProps, 'children'>,
    Omit<SwitchProps, 'defaultChecked' | 'checked' | 'onChange'>
{
  /**
   * Specifies the type of component to render.
   * @zh 指定渲染的组件类型
   * @iOS
   * @Android
   * @Harmony
   */
  as: 'Switch'
}

export type FormFieldProps =
  | FormFieldAsInput
  | FormFieldAsRadioGroup
  | FormFieldAsCheckbox
  | FormFieldAsTextArea
  | FormFieldAsSwitch

export interface FormSubmitButtonProps extends Omit<ButtonProps, 'onClick'> {
  /**
   * Callback function triggered when the submit button is clicked, after the form's internal submit logic.
   * @zh 提交按钮点击后，在表单内部提交逻辑执行后触发的回调函数
   * @iOS
   * @Android
   * @Harmony
   */
  onSubmit?: (values: Record<string, unknown>) => void
}
