// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext } from '@lynx-js/react'

export interface FormContextType {
  formData: Record<string, unknown>
  onChanged: (name: string, value: unknown) => void
  unregisterField: (name: string) => void
  submit: () => void
}

export const FormContext = createContext<FormContextType | undefined>(undefined)
