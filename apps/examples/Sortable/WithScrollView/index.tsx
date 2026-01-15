// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useCallback, useState } from '@lynx-js/react'

import './index.css'

import type { SortableData } from '@lynx-js/lynx-ui-sortable'
import {
  SortableItem,
  SortableItemArea,
  SortableRoot,
} from '@lynx-js/lynx-ui-sortable'

export function App() {
  const [data, setData] = useState<SortableData<string>[]>(
    Array.from(
      { length: 6 },
      (_, i) => ({
        dataItem: `${i}`,
        getSortingKey: () => `${i}`,
      }),
    ),
  )
  const [enableScroll, setEnableScroll] = useState<boolean>(true)

  const handleSortStart = useCallback(() => {
    setEnableScroll(false)
  }, [])

  const handleSortEnd = useCallback((sortedData: SortableData<string>[]) => {
    console.info('sortedData', sortedData)
    setEnableScroll(true)
    setData(sortedData)
  }, [])

  const renderSortableItem = useCallback((item: SortableData<string>) => {
    console.info('renderSortableItem outside')
    return (
      <SortableItem
        as='DraggableRoot'
        className={`sortable-item ${
          Number(item.dataItem) % 2 === 0
            ? 'even'
            : 'odd'
        }`}
        sortingKey={item.getSortingKey()}
      >
        <text style={{ flexGrow: '1' }}>{item.dataItem}</text>
        <SortableItemArea className='sortable-item-area'>
          <text>Drag Here</text>
        </SortableItemArea>
      </SortableItem>
    )
  }, [])

  return (
    <scroll-view
      className='scroll-view'
      enable-scroll={enableScroll}
      scroll-orientation='vertical'
    >
      <view className='sortable-root' id='sortableRoot'>
        <SortableRoot
          data={data}
          onSortStart={handleSortStart}
          onSortEnd={handleSortEnd}
          boundaryId='sortableRoot'
        >
          {renderSortableItem}
        </SortableRoot>
      </view>
    </scroll-view>
  )
}

root.render(<App />)
