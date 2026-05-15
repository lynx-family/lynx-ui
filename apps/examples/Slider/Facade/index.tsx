// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { forwardRef, memo, root, useState } from '@lynx-js/react'
import type { ForwardedRef, ReactNode } from '@lynx-js/react'

import {
  SliderIndicator,
  SliderRoot,
  SliderThumb,
  SliderTrack,
} from '@lynx-js/lynx-ui'
import type { SliderRef, SliderRootProps } from '@lynx-js/lynx-ui'

import './index.css'

interface SliderProps extends Omit<SliderRootProps, 'children'> {
  thumb?: ReactNode
  trackClassName?: string
  indicatorClassName?: string
  thumbWrapperClassName?: string
}

const Slider = memo(
  forwardRef(function Slider(
    props: SliderProps,
    ref: ForwardedRef<SliderRef>,
  ) {
    const {
      thumb,
      trackClassName,
      indicatorClassName,
      thumbWrapperClassName,
      ...rootProps
    } = props

    return (
      <SliderRoot ref={ref} {...rootProps}>
        <SliderTrack className={trackClassName}>
          <SliderIndicator className={indicatorClassName} />
          <SliderThumb className={thumbWrapperClassName}>
            {thumb}
          </SliderThumb>
        </SliderTrack>
      </SliderRoot>
    )
  }),
)

function formatValue(value: number) {
  return `${Math.round(value * 100)}%`
}

function App() {
  const [defaultValue, setDefaultValue] = useState(0.4)
  const [pillValue, setPillValue] = useState(0.72)

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas'>
        <view className='section'>
          <text className='title'>Facade</text>
          <text className='desc'>
            A single-component wrapper built from Slider primitives. This
            example shows how to compose your own facade for simple use cases.
          </text>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(defaultValue)}
            </text>
            <Slider
              className='slider-root'
              defaultValue={0.4}
              trackClassName='slider-track'
              indicatorClassName='slider-indicator'
              thumbWrapperClassName='slider-thumb-wrapper'
              thumb={<view className='slider-thumb' />}
              onValueChange={(value: number) => {
                setDefaultValue(value)
              }}
            />
          </view>

          <view className='row'>
            <text className='slider-label'>
              {formatValue(pillValue)}
            </text>
            <Slider
              className='slider-root'
              defaultValue={0.72}
              trackClassName='slider-track'
              indicatorClassName='slider-indicator'
              thumbWrapperClassName='slider-thumb-wrapper'
              thumb={<view className='slider-thumb-pill' />}
              onValueChange={(value: number) => {
                setPillValue(value)
              }}
            />
          </view>

          <view className='row'>
            <text className='slider-label disabled'>Readonly</text>
            <Slider
              className='slider-root'
              defaultValue={0.45}
              disabled
              trackClassName='slider-track'
              indicatorClassName='slider-indicator'
              thumbWrapperClassName='slider-thumb-wrapper'
              thumb={<view className='slider-thumb' />}
            />
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
