// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'
import type { SwiperRef } from '@lynx-js/lynx-ui'

import { Button } from '../Common/Button'
import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'

const itemArr: number[] = [1, 2, 3, 4, 5, 6, 7]

const itemWidths = [250, 350, 400]
const alignArr: ['start', 'center', 'end'] = ['start', 'center', 'end']

function SwiperEntry(): JSX.Element {
  const [itemWidthsIndex, setItemWidthsIndex] = useState<number>(0)
  const [alignIndex, setAlignIndex] = useState<number>(0)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const swiperRef = useRef<SwiperRef>(null)

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          ref={swiperRef}
          data={itemArr}
          itemWidth={itemWidths[itemWidthsIndex] ?? 0}
          itemHeight={250}
          containerWidth={lynx.__globalProps.screenWidth - 32
            || SystemInfo.pixelWidth / SystemInfo.pixelRatio - 32}
          duration={500}
          initialIndex={0}
          onChange={setCurrentIndex}
          mode='normal'
          modeConfig={{
            align: alignArr[alignIndex] ?? 'start',
            spaceBetween: 16,
          }}
          RTL={true}
          style={{
            overflow: 'visible',
          }}
          bounceConfig={{
            enable: true,
            startBounceItemWidth: 100,
            endBounceItemWidth: 100,
            startBounceItem: (
              <view className='bounce-item'>
                <text className='bounce-item-text'>Start</text>
              </view>
            ),
            endBounceItem: (
              <view className='bounce-item'>
                <text className='bounce-item-text'>End</text>
              </view>
            ),
            onEndBounceItemBounce: ({ type }) => {
              console.log('onBounce result', type)
            },
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
      <view className='operation'>
        <Button
          onClick={() => {
            swiperRef.current?.swipePrev()
          }}
          className='expand'
          text='SwipePrev'
        />
        <Button
          onClick={() => {
            swiperRef.current?.swipeNext()
          }}
          className='expand'
          type='primary'
          text='SwipeNext'
        />
      </view>
      <view className='sub-operation'>
        <Button
          onClick={() => {
            setItemWidthsIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text='Change Item Width'
          subText={`ItemWidth: ${itemWidths[itemWidthsIndex]}`}
        />
        <Button
          onClick={() => {
            setAlignIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text='Change Align Type'
          subText={`AlignType: ${alignArr[alignIndex]}`}
        />
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
