// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Button } from '@lynx-js/lynx-ui'
import { clsx } from 'clsx'

import { VEHICLE_PRESET_ROWS, formatPriceRange } from './data'
import type { PriceRange, VehiclePreset } from './data'

interface PricePresetsProps {
  selectedPrices: PriceRange
  onSelect: (preset: VehiclePreset) => void
}

export function PricePresets({
  selectedPrices,
  onSelect,
}: PricePresetsProps) {
  return (
    <view className='preset-list'>
      {VEHICLE_PRESET_ROWS.map((row, rowIndex) => (
        <view className='preset-row' key={`preset-row-${rowIndex}`}>
          {row.map((preset) => {
            const selected = selectedPrices[0] === preset.prices[0]
              && selectedPrices[1] === preset.prices[1]

            return (
              <Button
                className={clsx('preset', selected && 'selected')}
                key={preset.label}
                onClick={() => {
                  onSelect(preset)
                }}
              >
                <text className={clsx('preset-label', selected && 'selected')}>
                  {preset.label} {formatPriceRange(preset.prices)}
                </text>
              </Button>
            )
          })}
        </view>
      ))}
    </view>
  )
}
