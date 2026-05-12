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

import './index.css'

const PRESET_VALUES = [0, 0.25, 0.5, 0.75, 1]

function formatValue(value: number) {
  return `${Math.round(value * 100)}%`
}

function App() {
  const [value, setValue] = useState(0.32)
  const [primitiveDragging, setPrimitiveDragging] = useState(false)
  const [steppedValue, setSteppedValue] = useState(0.5)

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas'>
        <view className='section'>
          <text className='title'>Controlled</text>
          <text className='desc'>
            Pass `value` and `onValueChange` to fully control the slider from
            the outside. Use preset chips to jump to specific values.
          </text>

          <view className='row'>
            <text className='slider-label'>
              {primitiveDragging
                ? 'Dragging...'
                : formatValue(value)}
            </text>
            <SliderRoot
              className='slider-root'
              value={value}
              onDragging={() => {
                setPrimitiveDragging(true)
              }}
              onValueChange={(v: number) => {
                setValue(v)
              }}
              onValueCommit={() => {
                setPrimitiveDragging(false)
              }}
            >
              <SliderTrack className='slider-track'>
                <SliderIndicator className='slider-indicator' />
                <SliderThumb className='slider-thumb-wrapper'>
                  <view className='slider-thumb' />
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>

            <view className='preset-row'>
              {PRESET_VALUES.map((v) => (
                <view
                  key={`preset-${v}`}
                  className='preset-chip'
                  bindtap={() => {
                    setValue(v)
                  }}
                >
                  <text className='preset-label'>
                    {formatValue(v)}
                  </text>
                </view>
              ))}
            </view>
          </view>
        </view>

        <view className='section'>
          <text className='title'>Stepped</text>
          <text className='desc'>
            A slider with `step={0.1}` that snaps to 10% increments.
          </text>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(steppedValue)} — Step: 10%
            </text>
            <SliderRoot
              className='slider-root'
              value={steppedValue}
              step={0.1}
              onValueChange={(value: number) => {
                setSteppedValue(value)
              }}
            >
              <SliderTrack className='slider-track'>
                <SliderIndicator className='slider-indicator' />
                <SliderThumb className='slider-thumb-wrapper'>
                  <view className='slider-thumb' />
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
