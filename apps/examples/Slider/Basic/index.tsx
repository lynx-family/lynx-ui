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
  const [variantValue, setVariantValue] = useState(0.68)
  const [rtlValue, setRtlValue] = useState(0.4)

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas'>
        <view className='section'>
          <text className='title'>Variant</text>
          <text className='desc'>
            A slider with a bordered thumb and a filled thumb side by side.
          </text>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(variantValue)}
            </text>
            <SliderRoot
              className='slider-root'
              defaultValue={0.68}
              onValueChange={(value: number) => {
                setVariantValue(value)
              }}
            >
              <SliderTrack className='slider-track'>
                <SliderIndicator className='slider-indicator' />
                <SliderThumb className='slider-thumb-wrapper'>
                  <view className='slider-thumb-pill' />
                </SliderThumb>
              </SliderTrack>
            </SliderRoot>
          </view>

          <view className='row'>
            <text className='slider-label disabled'>Readonly</text>
            <SliderRoot
              className='slider-root ui-disabled'
              defaultValue={0.45}
              disabled
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

        <view className='section'>
          <text className='title'>RTL</text>
          <text className='desc'>
            A slider with `enableRTL` and CSS `direction: rtl`. The indicator
            grows from right to left.
          </text>

          <view className='row rtl-card'>
            <text className='slider-label'>
              {formatValue(rtlValue)}
            </text>
            <SliderRoot
              className='slider-root'
              enableRTL
              defaultValue={0.4}
              onValueChange={(value: number) => {
                setRtlValue(value)
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
