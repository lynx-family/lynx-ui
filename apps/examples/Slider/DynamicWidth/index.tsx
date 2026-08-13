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

import { OptionChipRow } from '../shared/OptionChipRow'

import './index.css'

const WIDTH_RATIOS = [0.56, 0.68, 0.8, 0.92, 1]
const DEMO_CONTAINER_HORIZONTAL_PADDING = 72

function formatValue(value: number) {
  return `${Math.round(value * 100)}%`
}

function App() {
  const [widthIndex, setWidthIndex] = useState(2)
  const [value, setValue] = useState(0.5)
  const screenWidth = lynx.__globalProps.screenWidth
    ?? SystemInfo.pixelWidth / SystemInfo.pixelRatio
  const availableCanvasWidth = Math.max(
    screenWidth - DEMO_CONTAINER_HORIZONTAL_PADDING,
    0,
  )
  const maxCanvasWidth = Math.min(
    420,
    availableCanvasWidth,
  )
  const widths = WIDTH_RATIOS.map((ratio) => {
    return Math.round((maxCanvasWidth * ratio) / 10) * 10
  })
  const currentWidth = widths[widthIndex] ?? widths[widths.length - 1]

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas' style={{ width: `${currentWidth}px` }}>
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

            <OptionChipRow
              options={widths}
              getKey={(width, index) => `width-${index}-${width}`}
              getLabel={(width) => `${width}px`}
              isSelected={(_, index) => index === widthIndex}
              onSelect={(_, index) => {
                setWidthIndex(index)
              }}
            />
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
