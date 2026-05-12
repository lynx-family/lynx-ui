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

const WIDTHS = [200, 300, 420, 280, 360]

function formatValue(value: number) {
  return `${Math.round(value * 100)}%`
}

function App() {
  const [widthIndex, setWidthIndex] = useState(2)
  const [value, setValue] = useState(0.5)
  const currentWidth = WIDTHS[widthIndex]

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas' style={{ maxWidth: `${currentWidth}px` }}>
        <view className='section'>
          <text className='title'>Dynamic Width</text>
          <text className='desc'>
            Tap the buttons below to change the slider container width. This
            tests the track layout measurement updating correctly.
          </text>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(value)} — {currentWidth}px
            </text>
            <SliderRoot
              className='slider-root'
              defaultValue={0.5}
              onValueChange={(v: number) => {
                setValue(v)
              }}
            >
              <SliderTrack className='slider-track'>
                <SliderIndicator className='slider-indicator' />
                <SliderThumb className='slider-thumb-wrapper'>
                  <view className='slider-thumb' />
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>

            <view className='width-row'>
              {WIDTHS.map((w, i) => (
                <view
                  key={`w-${w}`}
                  className={`width-chip${
                    i === widthIndex ? ' width-chip-active' : ''
                  }`}
                  bindtap={() => {
                    setWidthIndex(i)
                  }}
                >
                  <text
                    className={`width-label${
                      i === widthIndex ? ' width-label-active' : ''
                    }`}
                  >
                    {w}px
                  </text>
                </view>
              ))}
            </view>
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
