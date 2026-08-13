// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Button } from '@lynx-js/lynx-ui'
import { clsx } from 'clsx'
import './index.css'

interface OptionChipRowProps<T extends number | string> {
  options: readonly T[]
  getKey?: (option: T, index: number) => string
  getLabel?: (option: T, index: number) => string
  isSelected?: (option: T, index: number) => boolean
  onSelect: (option: T, index: number) => void
}

export function OptionChipRow<T extends number | string>({
  options,
  getKey,
  getLabel,
  isSelected,
  onSelect,
}: OptionChipRowProps<T>) {
  return (
    <view className='option-chip-row'>
      {options.map((option, index) => {
        const selected = isSelected?.(option, index) ?? false

        return (
          <Button
            key={getKey?.(option, index) ?? `option-${String(option)}-${index}`}
            className={clsx('option-chip', selected && 'option-chip--selected')}
            onClick={() => {
              onSelect(option, index)
            }}
          >
            <text
              className={clsx(
                'option-chip-label',
                selected && 'option-chip-label--selected',
              )}
            >
              {getLabel?.(option, index) ?? String(option)}
            </text>
          </Button>
        )
      })}
    </view>
  )
}
