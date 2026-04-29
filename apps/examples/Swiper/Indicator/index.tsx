// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'

import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'

const itemArr: number[] = [1, 2, 3, 4]

function SwiperEntry() {
  const [currentIndex, setCurrentIndex] = useState(0)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          data={itemArr}
          itemWidth={300}
          itemHeight={250}
          containerWidth={lynx.__globalProps.screenWidth - 32
            || SystemInfo.pixelWidth / SystemInfo.pixelRatio - 32}
          loop={false}
          duration={500}
          initialIndex={0}
          mode='normal'
          modeConfig={{
            align: 'center',
            spaceBetween: 16,
          }}
          bounceConfig={{
            enable: true,
            startBounceItemWidth: 100,
            startBounceItem: (
              <view className='bounce-item'>
                <text className='bounce-item-text'>Start</text>
              </view>
            ),
          }}
          onChange={setCurrentIndex}
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
        <Indicator
          current={currentIndex}
          count={itemArr.length}
        />
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
