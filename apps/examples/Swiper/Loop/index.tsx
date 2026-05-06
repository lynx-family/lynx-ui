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
  const SwiperItemGap = 8
  const screenWidth = lynx.__globalProps.screenWidth
    ?? SystemInfo.pixelWidth / SystemInfo.pixelRatio
  const containWidth = (screenWidth || 375) - SwiperItemGap * 2
  const itemWidth = ((screenWidth || 375) / 375) * 315

  console.log(
    'screenWidth, itemWidth, containWidth',
    screenWidth,
    itemWidth,
    containWidth,
  )
  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          data={itemArr}
          itemWidth={itemWidth + SwiperItemGap}
          itemHeight={250}
          containerWidth={containWidth}
          loop={true}
          duration={500}
          initialIndex={0}
          mode='normal'
          modeConfig={{
            spaceBetween: SwiperItemGap,
          }}
          autoPlay={true}
          onChange={setCurrentIndex}
          experimentalHorizontalSwipeOnly={true}
          style={{
            overflow: 'visible',
          }}
        >
          {({ index }) => (
            <SwiperItem>
              <Card
                index={index}
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
      <view className='demo-status'>
        <text className='demo-status-text'>
          Loop mode keeps autoplay continuous across the boundary.
        </text>
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
