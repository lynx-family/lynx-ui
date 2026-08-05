// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMemo } from '@lynx-js/react'
import type { ReactNode } from '@lynx-js/react'

import { RadioGroupContext } from './radio-group-context.js'
import type { RadioGroupContextValue } from './radio-group-context.js'

type RadioGroupProviderProps = RadioGroupContextValue & {
  children?: ReactNode
}

export function RadioGroupProvider({
  selectedValue,
  handleValueChange,
  disabled,
  children,
}: RadioGroupProviderProps) {
  const value: RadioGroupContextValue = useMemo(() => ({
    selectedValue,
    handleValueChange,
    disabled,
  }), [
    selectedValue,
    handleValueChange,
    disabled,
  ])

  return (
    <RadioGroupContext.Provider value={value}>
      {children}
    </RadioGroupContext.Provider>
  )
}
