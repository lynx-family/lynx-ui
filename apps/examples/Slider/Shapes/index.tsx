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

function formatValue(value: number) {
  return `${Math.round(value * 100)}%`
}

function App() {
  const [fullValue, setFullValue] = useState(0.4)
  const [gradientValue, setGradientValue] = useState(0.55)
  const [secondaryValue, setSecondaryValue] = useState(0.65)
  const [invertedRingValue, setInvertedRingValue] = useState(0.35)
  const [pillValue, setPillValue] = useState(0.5)

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas'>
        <view className='section'>
          <text className='title'>Shapes</text>
          <text className='desc'>
            Different visual shapes for thick sliders: full dot, ring, inverted
            ring, and pill.
          </text>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(fullValue)} — Full
            </text>
            <SliderRoot
              className='slider-root'
              defaultValue={0.4}
              onValueChange={(value: number) => {
                setFullValue(value)
              }}
            >
              <SliderTrack className='slider-track'>
                <SliderIndicator className='slider-indicator' />
                <SliderThumb className='slider-thumb-wrapper'>
                  <view className='slider-thumb-dot' />
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>
          </view>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(gradientValue)} — Gradient
            </text>
            <SliderRoot
              className='slider-root'
              defaultValue={0.55}
              onValueChange={(value: number) => {
                setGradientValue(value)
              }}
            >
              <SliderTrack className='slider-track slider-track-gradient'>
                <SliderIndicator className='slider-indicator slider-indicator-gradient' />
                <SliderThumb className='slider-thumb-wrapper slider-thumb-wrapper-gradient'>
                  <view className='slider-thumb-dot'>
                    <view className='slider-thumb-dot-ring' />
                  </view>
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>
          </view>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(secondaryValue)} — Ring
            </text>
            <SliderRoot
              className='slider-root'
              defaultValue={0.65}
              onValueChange={(value: number) => {
                setSecondaryValue(value)
              }}
            >
              <SliderTrack className='slider-track slider-track-secondary'>
                <SliderIndicator className='slider-indicator slider-indicator-secondary' />
                <SliderThumb className='slider-thumb-wrapper'>
                  <view className='slider-thumb-ring' />
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>
          </view>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(invertedRingValue)} — Inverted Ring
            </text>
            <SliderRoot
              className='slider-root'
              defaultValue={0.35}
              onValueChange={(value: number) => {
                setInvertedRingValue(value)
              }}
            >
              <SliderTrack className='slider-track slider-track-inverted'>
                <SliderIndicator className='slider-indicator' />
                <SliderThumb className='slider-thumb-wrapper'>
                  <view className='slider-thumb-ring-inverted'>
                    <view className='slider-thumb-dot-ring-inverted' />
                  </view>
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>
          </view>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(pillValue)} — Pill
            </text>
            <SliderRoot
              className='slider-root-pill'
              defaultValue={0.5}
              onValueChange={(value: number) => {
                setPillValue(value)
              }}
            >
              <SliderTrack className='slider-track-pill'>
                <SliderIndicator className='slider-indicator-pill' />
                <SliderThumb className='slider-thumb-pill-wrapper'>
                  <view className='slider-thumb-bar' />
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
