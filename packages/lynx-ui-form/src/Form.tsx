// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from '@lynx-js/react'

import { Button } from '@lynx-js/lynx-ui-button'
import { Checkbox } from '@lynx-js/lynx-ui-checkbox'
import { noop, useMemoizedFn } from '@lynx-js/lynx-ui-common'
import { Input, TextArea } from '@lynx-js/lynx-ui-input'
import { RadioGroupRoot } from '@lynx-js/lynx-ui-radio-group'
import { Switch } from '@lynx-js/lynx-ui-switch'

import { FormContext } from './FormContext'
import type { FormContextType } from './FormContext'
import type {
  FormFieldProps,
  FormRootProps,
  FormSubmitButtonProps,
} from './types'

type FormStateAction =
  | { type: 'CHANGED', payload: { name: string, value: unknown } }
  | { type: 'UNREGISTER', payload: { name: string } }

const formReducer = (
  state: Record<string, unknown>,
  action: FormStateAction,
) => {
  switch (action.type) {
    case 'CHANGED': {
      const { name, value } = action.payload
      if (state[name] === value) {
        return state
      }
      return {
        ...state,
        [name]: value,
      }
    }
    case 'UNREGISTER': {
      const { name } = action.payload
      if (!(name in state)) {
        return state
      }
      const { [name]: _, ...rest } = state
      return rest
    }
    default:
      return state
  }
}

export const useForm = (): FormContextType => {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error('useForm must be used within a FormRoot')
  }
  return context
}

export const FormRoot = ({
  children,
  initialValues,
  onSubmit,
  onChanged,
}: FormRootProps) => {
  const [formData, dispatch] = useReducer(formReducer, initialValues ?? {})
  const isMounted = useRef(false)
  const memoizedOnChanged = useMemoizedFn(onChanged ?? noop)

  useEffect(() => {
    if (isMounted.current) {
      memoizedOnChanged(formData)
    } else {
      isMounted.current = true
    }
  }, [formData, memoizedOnChanged])

  const internalOnChanged = useMemoizedFn((name: string, value: unknown) => {
    dispatch({ type: 'CHANGED', payload: { name, value } })
  })

  const unregisterField = useMemoizedFn((name: string) => {
    dispatch({ type: 'UNREGISTER', payload: { name } })
  })

  const submit = useMemoizedFn(() => {
    onSubmit?.(formData)
  })

  const contextValue = useMemo(
    () => ({
      formData,
      onChanged: internalOnChanged,
      unregisterField,
      submit,
    }),
    [formData, internalOnChanged, unregisterField, submit],
  )

  return (
    <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>
  )
}

export const FormField = ({
  as,
  name,
  children,
  onChanged,
  ...props
}: FormFieldProps) => {
  const {
    formData,
    onChanged: onFormChanged,
    unregisterField,
  } = useForm()

  useEffect(() => {
    const initialValue = formData[name] ?? null
    onFormChanged(name, initialValue)

    return () => {
      unregisterField(name)
    }
  }, [])

  const value = formData[name]

  const handleChange = (newValue: unknown) => {
    onFormChanged(name, newValue)
    onChanged?.(newValue)
  }

  const componentProps: Record<string, unknown> = {
    ...props,
    children,
  }

  if (as === 'RadioGroupRoot') {
    return (
      <RadioGroupRoot
        onValueChange={handleChange}
        defaultValue={value as string}
        {...componentProps}
      />
    )
  } else if (as === 'Input') {
    return (
      <Input
        defaultValue={value as string}
        onInput={handleChange}
        {...componentProps}
      />
    )
  } else if (as === 'TextArea') {
    return (
      <TextArea
        defaultValue={value as string}
        onInput={handleChange}
        {...componentProps}
      />
    )
  } else if (as === 'Checkbox') {
    return (
      <Checkbox
        defaultChecked={value as boolean}
        onChange={handleChange}
        {...componentProps}
      />
    )
  } else if (as === 'Switch') {
    return (
      <Switch
        defaultChecked={value as boolean}
        onChange={handleChange}
        {...componentProps}
      />
    )
  } else {
    throw new Error(`FormField component does not support as="${String(as)}"`)
  }
}

export const FormSubmitButton = ({
  onSubmit,
  ...props
}: FormSubmitButtonProps) => {
  const { submit, formData } = useForm()

  const handleClick = () => {
    submit()
    onSubmit?.(formData)
  }

  return <Button onClick={handleClick} {...props} />
}
