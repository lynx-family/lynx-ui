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

const VERTICAL_ITEMS = Array.from({ length: 8 }, (_, i) => i)

function SliderCard({ index }: { index: number }) {
  const [value, setValue] = useState(0.5)

  return (
    <view className='card'>
      <text className='card-title'>Slider {index + 1}</text>
      <text className='card-value'>{formatValue(value)}</text>
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
    </view>
  )
}

function App() {
  return (
    <view className='demo-container lunaris-dark'>
      <text className='header'>Slider in Nested ScrollView</text>
      <scroll-view
        scroll-orientation='vertical'
        className='vertical-scroll'
      >
        {VERTICAL_ITEMS.map((i) => (
          <view className='horizontal-section' key={`section-${i}`}>
            <text className='section-title'>Section {i + 1}</text>
            <scroll-view
              scroll-orientation='horizontal'
              className='horizontal-scroll'
            >
              <view className='horizontal-content'>
                <SliderCard index={i * 3} />
                <SliderCard index={i * 3 + 1} />
                <SliderCard index={i * 3 + 2} />
              </view>
            </scroll-view>
          </view>
        ))}
      </scroll-view>
    </view>
  )
}

root.render(<App />)

export default App
