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

function customAnimation(value: number, _index: number) {
  'main thread'

  const RTL = true
  const sign = RTL ? -1 : 1

  const scale = interpolate(value, [-1, 0, 1], [0.8, 1, 0.8])

  const centerOffset = ((lynx.__globalProps.screenWidth
    ?? SystemInfo.pixelWidth / SystemInfo.pixelRatio) - ITEM_WIDTH) / 2
  const translateX = interpolate(value, [-1, 0, 1], [
    -ITEM_WIDTH + centerOffset,
    centerOffset,
    ITEM_WIDTH + centerOffset,
  ], 'extend')

  return {
    transform: `translateX(${sign * translateX}px) scale(${scale})`,
    'transform-origin': 'center',
  }
}

function customAnimationFirstScreen(value: number, _index: number) {
  const RTL = true
  const sign = RTL ? -1 : 1

  const scale = interpolateJS(value, [-1, 0, 1], [0.8, 1, 0.8])

  const centerOffset = ((lynx.__globalProps.screenWidth
    ?? SystemInfo.pixelWidth / SystemInfo.pixelRatio) - ITEM_WIDTH) / 2
  const translateX = interpolateJS(value, [-1, 0, 1], [
    -ITEM_WIDTH + centerOffset,
    centerOffset,
    ITEM_WIDTH + centerOffset,
  ], 'extend')

  return {
    transform: `translateX(${sign * translateX}px) scale(${scale})`,
    'transform-origin': 'center',
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
          itemHeight={250}
          duration={500}
          initialIndex={0}
          mode='custom'
          modeConfig={{
            align: 'center',
          }}
          RTL={true}
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
          RTL custom mode mirrors the same centered scale animation.
        </text>
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
