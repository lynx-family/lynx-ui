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

function customAnimation(value: number, _index: number) {
  'main thread'

  const scale = interpolate(value, [-1, 0, 1], [0.86, 1, 0.86])
  const translateY = interpolate(value, [-1, 0, 1], [12, 0, 12])
  const opacity = interpolate(value, [-1, 0, 1], [0.64, 1, 0.64])

  return {
    transform: `translateY(${translateY}px) scale(${scale})`,
    opacity,
  }
}

function customAnimationFirstScreen(value: number, _index: number) {
  const scale = interpolateJS(value, [-1, 0, 1], [0.86, 1, 0.86])
  const translateY = interpolateJS(value, [-1, 0, 1], [12, 0, 12])
  const opacity = interpolateJS(value, [-1, 0, 1], [0.64, 1, 0.64])

  return {
    transform: `translateY(${translateY}px) scale(${scale})`,
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
          itemWidth={250}
          itemHeight={250}
          containerWidth={lynx.__globalProps.screenWidth - 32
            || SystemInfo.pixelWidth / SystemInfo.pixelRatio - 32}
          duration={500}
          initialIndex={0}
          mode='normal'
          modeConfig={{
            align: 'center',
            spaceBetween: 16,
          }}
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
          Custom animation scales each slide around the active item.
        </text>
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
