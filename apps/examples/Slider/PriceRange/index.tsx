// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from '@lynx-js/lynx-ui'
import type { SliderRangeValue } from '@lynx-js/lynx-ui'

import {
  INITIAL_RANGE,
  MAX_PRICE,
  MIN_PRICE,
  formatPriceRange,
  ratioToPrice,
  toSliderRange,
} from './data'
import type { PriceRange, VehiclePreset } from './data'
import { PricePresets } from './PricePresets'
import './index.css'

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
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas card'>
        <view className='header'>
          <text className='heading'>
            Selected price range
          </text>
          <text className='status'>
            {dragging
              ? 'Adjusting price range'
              : `Confirmed ${formatPriceRange(committedPrices)}`}
          </text>
        </view>

        <view className='selection'>
          <text className='selection-label'>Price range</text>
          <text className='selection-value'>
            {formatPriceRange(displayedPrices)}
          </text>
        </view>

        <view className='slider-section'>
          <SliderRoot
            className='slider'
            value={range}
            step={1 / (MAX_PRICE - MIN_PRICE)}
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
            <SliderTrack className='slider-track'>
              <SliderIndicator className='slider-indicator' />
              <SliderThumb index={0} className='slider-thumb'>
                <text className='thumb-label'>
                  ${displayedPrices[0]}
                </text>
                <view className='thumb-dot' />
              </SliderThumb>
              <SliderThumb index={1} className='slider-thumb'>
                <text className='thumb-label'>
                  ${displayedPrices[1]}
                </text>
                <view className='thumb-dot' />
              </SliderThumb>
            </SliderTrack>
          </SliderRoot>

          <view className='endpoints'>
            <text className='endpoint'>${MIN_PRICE}</text>
            <text className='endpoint'>${MAX_PRICE}</text>
          </view>
        </view>

        <PricePresets
          selectedPrices={displayedPrices}
          onSelect={selectPreset}
        />
      </view>
    </view>
  )
}

root.render(<App />)

export default App
