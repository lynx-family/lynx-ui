// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'

import { Card } from '../Common/Card'

import '../Common/Demo/styles.css'

const itemArr: number[] = [1, 2, 3, 4]

function renderCard({
  index,
}: {
  index: number
}) {
  return (
    <SwiperItem>
      <Card
        index={index}
        style={{
          height: '200px',
        }}
      />
    </SwiperItem>
  )
}

function SwiperEntry() {
  return (
    <scroll-view
      className='demo-scroll-container lunaris-dark'
      scroll-orientation='vertical'
    >
      <view className='top-area' />
      <view className='demo-section'>
        <text className='demo-section-title'>Horizontal Swipe Only</text>
        <text className='demo-section-description'>
          Swiper stays horizontal while the parent scroll-view moves vertically.
        </text>
      </view>
      <view className='content-area content-area--compact'>
        <Swiper
          data={itemArr}
          itemWidth={250}
          itemHeight={200}
          containerWidth={lynx.__globalProps.screenWidth - 32
            || SystemInfo.pixelWidth / SystemInfo.pixelRatio - 32}
          loop={false}
          duration={500}
          initialIndex={0}
          mode='normal'
          modeConfig={{
            align: 'start',
            spaceBetween: 16,
          }}
          bounceConfig={{
            enable: true,
            startBounceItemWidth: 0,
            endBounceItem: (
              <view className='bounce-item'>
                <text className='bounce-item-text'>End</text>
              </view>
            ),
            onEndBounceItemBounce: ({ type }) => {
              console.log('onBounce result', type)
            },
          }}
          experimentalHorizontalSwipeOnly={true}
          style={{
            overflow: 'visible',
          }}
        >
          {renderCard}
        </Swiper>
        <Swiper
          data={itemArr}
          itemWidth={250}
          itemHeight={200}
          containerWidth={lynx.__globalProps.screenWidth - 32
            || SystemInfo.pixelWidth / SystemInfo.pixelRatio - 32}
          loop={false}
          duration={500}
          initialIndex={0}
          mode='normal'
          modeConfig={{
            align: 'start',
            spaceBetween: 16,
          }}
          bounceConfig={{
            enable: true,
            startBounceItemWidth: 0,
            endBounceItem: (
              <view className='bounce-item'>
                <text className='bounce-item-text'>End</text>
              </view>
            ),
            onEndBounceItemBounce: ({ type }) => {
              console.log('onBounce result', type)
            },
          }}
          experimentalHorizontalSwipeOnly={true}
          style={{
            overflow: 'visible',
          }}
        >
          {renderCard}
        </Swiper>
      </view>
    </scroll-view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
