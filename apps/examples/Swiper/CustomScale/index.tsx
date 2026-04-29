// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import {
  Swiper,
  SwiperItem,
  interpolate,
  interpolateJS,
} from '@lynx-js/lynx-ui'
import type { SwiperRef } from '@lynx-js/lynx-ui'

import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'

const itemArr: number[] = [1, 2, 3, 4, 5]

const ITEM_WIDTH = 250
const ITEM_HEIGHT = 250

function customAnimation(value: number, _index: number) {
  'main thread'

  const centerOffset = ((lynx.__globalProps.screenWidth
    ?? SystemInfo.pixelWidth / SystemInfo.pixelRatio) - ITEM_WIDTH) / 2
  const translateX = interpolate(value, [-1, 0, 1], [
    -ITEM_WIDTH + centerOffset,
    centerOffset,
    ITEM_WIDTH + centerOffset,
  ], 'extend')
  const scale = interpolate(value, [-1, 0, 1], [0.84, 1, 0.84])
  const opacity = interpolate(value, [-1, 0, 1], [0.72, 1, 0.72])

  return {
    transform: `translateX(${translateX}px) scale(${scale})`,
    'transform-origin': 'center',
    opacity,
  }
}

function customAnimationFirstScreen(value: number, _index: number) {
  const centerOffset = ((lynx.__globalProps.screenWidth
    ?? SystemInfo.pixelWidth / SystemInfo.pixelRatio) - ITEM_WIDTH) / 2
  const translateX = interpolateJS(value, [-1, 0, 1], [
    -ITEM_WIDTH + centerOffset,
    centerOffset,
    ITEM_WIDTH + centerOffset,
  ], 'extend')
  const scale = interpolateJS(value, [-1, 0, 1], [0.84, 1, 0.84])
  const opacity = interpolateJS(value, [-1, 0, 1], [0.72, 1, 0.72])

  return {
    transform: `translateX(${translateX}px) scale(${scale})`,
    'transform-origin': 'center',
    opacity,
  }
}

function SwiperEntry(): JSX.Element {
  const swiperRef = useRef<SwiperRef>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          ref={swiperRef}
          data={itemArr}
          itemWidth={ITEM_WIDTH}
          itemHeight={ITEM_HEIGHT}
          duration={500}
          initialIndex={0}
          mode='custom'
          onChange={setCurrentIndex}
          main-thread:customAnimation={customAnimation}
          customAnimationFirstScreen={customAnimationFirstScreen}
          style={{
            overflow: 'visible',
          }}
        >
          {({ index, realIndex }) => (
            <SwiperItem index={index} key={realIndex} realIndex={realIndex}>
              <Card
                index={realIndex}
                style={{
                  height: '250px',
                }}
              />
            </SwiperItem>
          )}
        </Swiper>
        <Indicator current={currentIndex} count={itemArr.length} />
      </view>
      <view className='demo-status'>
        <text className='demo-status-text'>
          Custom mode keeps the active slide centered while scaling neighbors.
        </text>
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
