// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'

import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'
import './styles.css'

const itemArr: number[] = [1, 2, 3, 4]
const CONTAINER_PADDING = 32
const BOUNCE_WIDTH = 96
const ITEM_GAP = 16
const ITEM_HEIGHT = 220

const getScreenWidth = () =>
  lynx.__globalProps.screenWidth
  || SystemInfo.pixelWidth / SystemInfo.pixelRatio

function SwiperEntry() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerWidth = getScreenWidth() - CONTAINER_PADDING
  const itemWidth = Math.min(300, containerWidth - 48)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area bounces-content-area'>
        <Swiper
          data={itemArr}
          itemWidth={itemWidth}
          itemHeight={ITEM_HEIGHT}
          containerWidth={containerWidth}
          loop={false}
          duration={500}
          initialIndex={2}
          mode='normal'
          modeConfig={{
            align: 'start',
            spaceBetween: ITEM_GAP,
          }}
          style={{
            overflow: 'hidden',
          }}
          bounceConfig={{
            enable: true,
            startBounceItemWidth: 0,
            endBounceItemWidth: BOUNCE_WIDTH,
            endBounceItem: (
              <view className='bounce-loading'>
                <view className='bounce-loading-dot bounce-loading-dot--first' />
                <view className='bounce-loading-dot bounce-loading-dot--second' />
                <view className='bounce-loading-dot bounce-loading-dot--third' />
              </view>
            ),
            onEndBounceItemBounce: ({ type }) => {
              console.log('onBounce result', type)
            },
          }}
          onChange={setCurrentIndex}
        >
          {({ index, realIndex }) => (
            <SwiperItem index={index} key={realIndex} realIndex={realIndex}>
              <Card
                index={realIndex}
                style={{
                  height: `${ITEM_HEIGHT}px`,
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
