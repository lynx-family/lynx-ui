// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useRef, useState } from '@lynx-js/react'

import { Button } from '@lynx-js/lynx-ui-button'
import { List } from '@lynx-js/lynx-ui-list'
import type { ListRef } from '@lynx-js/lynx-ui-list'

import { ListItemCard } from './ListItemCard'

import './index.css'

const itemData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
const orientation = 'vertical'
const scrollToIndex = 7

function App() {
  const listRef = useRef<ListRef>(null)
  const [isAutoScrolling, setIsAutoScrolling] = useState(false)

  const handleAutoScrollClick = () => {
    setIsAutoScrolling(prev => !prev)
    listRef.current?.autoScroll('60px', !isAutoScrolling, true)
  }

  return (
    <view className='container lunaris-dark'>
      <List
        className='list'
        listId='ListBasic'
        ref={listRef}
        listType='single'
        spanCount={1}
        scrollOrientation={orientation}
        useRefactorList={true}
        bounces={false}
      >
        {itemData.map((value: number) => (
          <list-item key={value + ''} item-key={value + ''}>
            <ListItemCard
              cardKey={value + ''}
              letter={value + ''}
              height={300}
            />
          </list-item>
        ))}
      </List>
      <view className='button-container'>
        <Button
          className='button'
          onClick={() =>
            listRef.current?.scrollTo(true, 'middle', scrollToIndex, 0)}
        >
          <text className='button-text'>
            {`scrollTo(index ${scrollToIndex})`}
          </text>
        </Button>
        <Button
          className='button neutral'
          onClick={handleAutoScrollClick}
        >
          <text className='button-text neutral'>autoScroll()</text>
        </Button>
        <Button
          className='button subtle'
          onClick={() => console.log(listRef.current?.getVisibleCells())}
        >
          <text className='button-text subtle'>getVisibleCells()</text>
        </Button>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
