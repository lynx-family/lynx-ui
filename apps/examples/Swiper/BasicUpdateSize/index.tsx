// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useRef, useState } from '@lynx-js/react'

import { Swiper, SwiperItem } from '@lynx-js/lynx-ui'
import type { SwiperRef } from '@lynx-js/lynx-ui'

import { Button } from '../Common/Button'
import { Card } from '../Common/Card'
import { Indicator } from '../Common/Indicator'

import '../Common/Demo/styles.css'

const DEFAULT_ITEM_ARR: number[] = [1, 2, 3, 4, 5, 6, 7, 8]

const itemWidths = [250, 350, 400]
const alignArr: ['start', 'center', 'end'] = ['start', 'center', 'end']
const INITIAL_INDEX = 0

function SwiperEntry(): JSX.Element {
  const [itemWidthsIndex, setItemWidthsIndex] = useState<number>(0)
  const [alignIndex, setAlignIndex] = useState<number>(1)
  const [currentIndex, setCurrentIndex] = useState<number>(INITIAL_INDEX)
  const swiperRef = useRef<SwiperRef>(null)
  const [itemArr, setItemArr] = useState<number[]>([])

  useEffect(() => {
    setTimeout(() => {
      setItemArr(DEFAULT_ITEM_ARR.slice(0, 4))
    }, 1000)
  }, [])

  return (
    <view className='demo-container lunaris-dark'>
      <view className='top-area' />
      <view className='content-area'>
        <Swiper
          ref={swiperRef}
          data={itemArr}
          itemWidth={itemWidths[itemWidthsIndex] ?? 0}
          containerWidth={itemWidths[itemWidthsIndex] ?? 0}
          itemHeight={250}
          duration={500}
          initialIndex={INITIAL_INDEX}
          onChange={setCurrentIndex}
          mode='normal'
          loop={true}
          autoPlay={false}
          modeConfig={{
            align: alignArr[alignIndex] ?? 'center',
            spaceBetween: 16,
          }}
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
          text='Update Container Width'
          subText={`Width: ${itemWidths[itemWidthsIndex]}`}
        />
        <Button
          onClick={() => {
            setAlignIndex(prev => (prev + 1) % itemWidths.length)
          }}
          text='Change Align Type'
          subText={`AlignType: ${alignArr[alignIndex]}`}
        />
        <Button
          onClick={() => {
            setItemArr(prev => DEFAULT_ITEM_ARR.slice(0, prev.length + 1))
          }}
          text='Add List Item'
          subText={`Current Length: ${itemArr.length}`}
        />
      </view>
    </view>
  )
}

root.render(<SwiperEntry />)

export default SwiperEntry
