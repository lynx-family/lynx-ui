// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useContext } from '@lynx-js/react'

import { RadioGroupContext } from './radio-group-context.js'

export function useRadioGroup() {
  const ctx = useContext(RadioGroupContext)
  if (!ctx) {
    throw new Error('useRadioGroup must be used within RadioGroupProvider')
  }
  return ctx
}
