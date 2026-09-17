// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Button, ViewPager } from '@lynx-js/lynx-ui'
import type { ViewPagerRef } from '@lynx-js/lynx-ui'

import './index.css'

const destinations = [
  {
    id: 'aurora',
    number: '01',
    eyebrow: 'NORTHERN LIGHTS',
    title: 'Chase the aurora',
    description: 'Quiet skies, frozen lakes, and a night painted in color.',
    className: 'view-pager-gallery__page--primary',
  },
  {
    id: 'coast',
    number: '02',
    eyebrow: 'PACIFIC COAST',
    title: 'Follow the horizon',
    description: 'A slow drive through sea air, cliffs, and open roads.',
    className: 'view-pager-gallery__page--secondary',
  },
  {
    id: 'city',
    number: '03',
    eyebrow: 'AFTER DARK',
    title: 'Meet the night',
    description: 'Neon streets, late dinners, and a city still moving.',
    className: 'view-pager-gallery__page--neutral',
  },
]

function App() {
  const pagerRef = useRef<ViewPagerRef>(null)
  const [index, setIndex] = useState(0)

  return (
    <view className='view-pager-gallery lunaris-dark'>
      <view className='view-pager-gallery__header'>
        <text className='view-pager-gallery__overline'>FEATURED JOURNEYS</text>
        <text className='view-pager-gallery__heading'>Swipe to explore</text>
        <text className='view-pager-gallery__intro'>
          Drag the gallery or use the controls to select a page.
        </text>
      </view>
      <ViewPager
        ref={pagerRef}
        data={destinations}
        getItemKey={destination => destination.id}
        lazyOptions={{
          enableLazy: true,
          scene: 'view-pager-gallery',
          exposureLeft: '80px',
          exposureRight: '80px',
        }}
        onPageChange={event => setIndex(event.detail.index)}
        className='view-pager-gallery__pager'
        itemClassName='view-pager-gallery__item'
        getItemProps={destination => ({
          className: destination.className,
          itemProps: { 'accessibility-label': destination.title },
        })}
      >
        {destination => (
          <view className='view-pager-gallery__card'>
            <text className='view-pager-gallery__number'>
              {destination.number}
            </text>
            <view className='view-pager-gallery__copy'>
              <text className='view-pager-gallery__eyebrow'>
                {destination.eyebrow}
              </text>
              <text className='view-pager-gallery__title'>
                {destination.title}
              </text>
              <text className='view-pager-gallery__description'>
                {destination.description}
              </text>
            </view>
          </view>
        )}
      </ViewPager>
      <view className='view-pager-gallery__status'>
        <view className='view-pager-gallery__indicators'>
          {destinations.map((destination, pageIndex) => (
            <view
              key={destination.id}
              className={`view-pager-gallery__indicator ${
                pageIndex === index
                  ? 'view-pager-gallery__indicator--active'
                  : ''
              }`}
            />
          ))}
        </view>
        <text className='view-pager-gallery__count'>
          {index + 1} / {destinations.length}
        </text>
      </view>
      <view className='view-pager-gallery__controls'>
        <Button
          disabled={index === 0}
          onClick={() => pagerRef.current?.selectTab(index - 1)}
        >
          <text>Previous</text>
        </Button>
        <Button
          disabled={index === destinations.length - 1}
          onClick={() => pagerRef.current?.selectTab(index + 1)}
        >
          <text>Next</text>
        </Button>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
