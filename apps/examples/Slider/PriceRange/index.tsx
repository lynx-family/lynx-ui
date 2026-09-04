// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  Button,
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from '@lynx-js/lynx-ui'
import type { SliderRangeValue } from '@lynx-js/lynx-ui'
import { clsx } from 'clsx'

import './index.css'

type PriceRange = readonly [number, number]

interface VehiclePreset {
  label: string
  prices: PriceRange
}

const MIN_PRICE = 14
const MAX_PRICE = 140
const PRICE_SPAN = MAX_PRICE - MIN_PRICE

const VEHICLE_PRESETS: readonly VehiclePreset[] = [
  { label: 'Saver', prices: [16, 40] },
  { label: 'Economy', prices: [16, 46] },
  { label: 'Taxi', prices: [18, 60] },
  { label: 'Comfort', prices: [20, 70] },
  { label: 'Business', prices: [80, 120] },
  { label: 'Luxury', prices: [80, 140] },
]

const VEHICLE_PRESET_ROWS = [
  VEHICLE_PRESETS.slice(0, 2),
  VEHICLE_PRESETS.slice(2, 4),
  VEHICLE_PRESETS.slice(4, 6),
]

function priceToRatio(price: number): number {
  return (price - MIN_PRICE) / PRICE_SPAN
}

function ratioToPrice(ratio: number): number {
  return Math.round(MIN_PRICE + ratio * PRICE_SPAN)
}

function toSliderRange(prices: PriceRange): SliderRangeValue {
  return [priceToRatio(prices[0]), priceToRatio(prices[1])]
}

function formatPriceRange(prices: PriceRange): string {
  return `$${prices[0]}–$${prices[1]}`
}

const INITIAL_RANGE = toSliderRange(VEHICLE_PRESETS[0].prices)

function App() {
  const [range, setRange] = useState<SliderRangeValue>(INITIAL_RANGE)
  const [committedRange, setCommittedRange] = useState<SliderRangeValue>(
    INITIAL_RANGE,
  )
  const [dragging, setDragging] = useState(false)

  const displayedPrices: PriceRange = [
    ratioToPrice(range[0]),
    ratioToPrice(range[1]),
  ]
  const committedPrices: PriceRange = [
    ratioToPrice(committedRange[0]),
    ratioToPrice(committedRange[1]),
  ]

  const selectPreset = (preset: VehiclePreset) => {
    const nextRange = toSliderRange(preset.prices)
    setRange(nextRange)
    setCommittedRange(nextRange)
    setDragging(false)
  }

  return (
    <view className='demo-container price-range-page lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas price-range-card'>
        <view className='price-range-header'>
          <view className='price-range-heading-group'>
            <text className='price-range-heading'>
              Selected price range
            </text>
            <text className='price-range-drag-status'>
              {dragging
                ? 'Adjusting price range'
                : `Confirmed ${formatPriceRange(committedPrices)}`}
            </text>
          </view>
          <text className='price-range-all-vehicles'>All vehicles ›</text>
        </view>

        <view className='price-range-selection'>
          <text className='price-range-selection-label'>Price range</text>
          <text className='price-range-selection-value'>
            {formatPriceRange(displayedPrices)}
          </text>
        </view>

        <view className='price-range-slider-section'>
          <SliderRoot
            className='price-range-slider'
            value={range}
            step={1 / PRICE_SPAN}
            onDragging={() => {
              setDragging((active) => !active)
            }}
            onValueChange={(nextValue) => {
              setRange(nextValue)
            }}
            onValueCommit={(nextValue) => {
              setRange(nextValue)
              setCommittedRange(nextValue)
              setDragging(false)
            }}
          >
            <SliderTrack className='price-range-track'>
              <SliderIndicator className='price-range-indicator' />
              <SliderThumb index={0} className='price-range-thumb'>
                <text className='price-range-thumb-label'>
                  ${displayedPrices[0]}
                </text>
                <view className='price-range-thumb-dot' />
              </SliderThumb>
              <SliderThumb index={1} className='price-range-thumb'>
                <text className='price-range-thumb-label'>
                  ${displayedPrices[1]}
                </text>
                <view className='price-range-thumb-dot' />
              </SliderThumb>
            </SliderTrack>
          </SliderRoot>

          <view className='price-range-endpoints'>
            <text className='price-range-endpoint'>${MIN_PRICE}</text>
            <text className='price-range-endpoint'>${MAX_PRICE}</text>
          </view>
        </view>

        <view className='price-range-response-hint'>
          <text className='price-range-response-icon'>⚡</text>
          <text className='price-range-response-text'>
            Estimated response in about 2 min
          </text>
        </view>

        <view className='price-range-options'>
          {VEHICLE_PRESET_ROWS.map((row, rowIndex) => (
            <view
              className='price-range-option-row'
              key={`price-range-row-${rowIndex}`}
            >
              {row.map((preset) => {
                const selected = displayedPrices[0] === preset.prices[0]
                  && displayedPrices[1] === preset.prices[1]

                return (
                  <Button
                    className={clsx(
                      'price-range-option',
                      selected && 'price-range-option--selected',
                    )}
                    key={preset.label}
                    onClick={() => {
                      selectPreset(preset)
                    }}
                  >
                    <text
                      className={clsx(
                        'price-range-option-text',
                        selected && 'price-range-option-text--selected',
                      )}
                    >
                      {preset.label} {formatPriceRange(preset.prices)}
                    </text>
                  </Button>
                )
              })}
            </view>
          ))}
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
