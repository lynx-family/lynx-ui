// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef } from '@lynx-js/react'

import { convertToPx } from '@lynx-js/lynx-ui-common'
import { List } from '@lynx-js/lynx-ui-list'
import type { ListRef } from '@lynx-js/lynx-ui-list'

function App() {
  const listRef = useRef<ListRef>(null)

  const data = Array.from({ length: 2 }, (_, index) => index)
  const orientation = 'vertical'
  const listSize = '500px'

  return (
    <view style={{ width: '100%', height: '100%' }}>
      <List
        ref={listRef}
        style={{ width: '100vw' }}
        listId='listBasic'
        listType='single'
        spanCount={1}
        listMaxSize={convertToPx('750rpx')}
        scrollOrientation={orientation}
      >
        {data.map((value: number) => (
          <list-item
            item-key={value.toString()}
            id={value.toString()}
            key={value.toString()}
          >
            <view
              style={{
                width: orientation === 'vertical' ? '100vw' : listSize,
                height: orientation === 'vertical' ? '100px' : listSize,
                display: 'flex',
                flexDirection: 'column',
                borderWidth: '2px',
                borderColor: 'red',
              }}
            >
              <text>{value.toString()}</text>
              <view
                style={{
                  width: '100vw',
                  backgroundColor: 'green',
                  flexGrow: 1,
                }}
                id={`inner${value.toString()}`}
              />
            </view>
          </list-item>
        ))}
        <list-item
          item-key='footer'
          id='footer'
          key='footer'
        >
          <view
            style={{
              width: orientation === 'vertical' ? '100%' : listSize,
              height: orientation === 'vertical' ? '100px' : listSize,
              display: 'flex',
              flexDirection: 'column',
              borderWidth: '2px',
              borderColor: 'red',
            }}
          >
            <text>footer</text>
            <view
              style={{ width: '100%', backgroundColor: 'green', flexGrow: 1 }}
              id={`footer`}
            />
          </view>
        </list-item>
      </List>
    </view>
  )
}

root.render(<App />)

export default App
