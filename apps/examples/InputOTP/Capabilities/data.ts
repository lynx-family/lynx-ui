// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { InputOTPInputType } from '@lynx-js/lynx-ui'

export interface InputTypeFixture {
  defaultValue: string
  inputType: InputOTPInputType
  label: string
}

export const INPUT_TYPE_FIXTURES: readonly InputTypeFixture[] = [
  {
    defaultValue: 'AB-cd1',
    inputType: 'alphabetic',
    label: 'Alphabetic',
  },
  {
    defaultValue: '6a51.4',
    inputType: 'numeric',
    label: 'Numeric',
  },
  {
    defaultValue: 'A1-b2',
    inputType: 'alphanumeric',
    label: 'Alphanumeric',
  },
]
