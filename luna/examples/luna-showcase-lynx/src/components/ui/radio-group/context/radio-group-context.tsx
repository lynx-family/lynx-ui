// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext } from '@lynx-js/react'

interface RadioGroupContextValue {
  selectedValue: string | undefined
  handleValueChange: (value: string) => void
  disabled: boolean
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

export { RadioGroupContext }
export type { RadioGroupContextValue }
