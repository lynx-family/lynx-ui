// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useCallback, useState } from '@lynx-js/react'

import './index.css'

import { SortableItem, SortableItemArea, SortableRoot } from '@lynx-js/lynx-ui'
import type { SortableData } from '@lynx-js/lynx-ui'

import type { SortableDemoItem } from '../shared/data'
import { createDemoData } from '../shared/data'

function scrollShortBoundaryBy(offset: number) {
  'main thread'
  lynx.querySelector('#shortSortableScrollView')?.invoke('scrollBy', {
    offset,
  })
}

export function App() {
  const [data, setData] = useState<SortableData<SortableDemoItem>[]>(
    () => createDemoData(18),
  )

  const handleSortEnd = useCallback(
    (sortedData: SortableData<SortableDemoItem>[]) => {
      setData(sortedData)
    },
    [],
  )

  const renderSortableItem = useCallback(
    (item: SortableData<SortableDemoItem>) => {
      const { id, tone } = item.dataItem
      const numericId = Number(id)
      const paletteIndex = numericId % 6

      return (
        <SortableItem
          key={item.getSortingKey()}
          as='DraggableRoot'
          className='sortable-item'
          sortingKey={item.getSortingKey()}
        >
          <view
            className={`sortable-item-surface sortable-item--${paletteIndex}`}
          >
            <view className='sortable-item-content'>
              <text className={`sortable-item-title drag-here-text--${tone}`}>
                {`Row ${numericId + 1}`}
              </text>
              <text className='sortable-item-subtitle'>
                Middle scroll-view boundary
              </text>
            </view>
            <SortableItemArea className='sortable-item-area'>
              <text className={`drag-here-text drag-here-text--${tone}`}>
                Drag
              </text>
            </SortableItemArea>
          </view>
        </SortableItem>
      )
    },
    [],
  )

  const handleScrollUpTap = useCallback(() => {
    'main thread'
    scrollShortBoundaryBy(-160)
  }, [])

  const handleScrollDownTap = useCallback(() => {
    'main thread'
    scrollShortBoundaryBy(160)
  }, [])

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='outside-panel outside-panel--top'>
        <text className='outside-panel-title'>Content Above</text>
        <text className='outside-panel-copy'>
          The sortable scroll-view below is intentionally shorter than the
          screen.
        </text>
      </view>

      <view className='scroll-by-actions'>
        <view
          className='scroll-by-button'
          main-thread:bindtap={handleScrollUpTap}
        >
          <text className='scroll-by-button-text'>Scroll Up</text>
        </view>
        <view
          className='scroll-by-button scroll-by-button--primary'
          main-thread:bindtap={handleScrollDownTap}
        >
          <text className='scroll-by-button-text'>Scroll Down</text>
        </view>
      </view>

      <SortableRoot
        data={data}
        onSortEnd={handleSortEnd}
        boundaryId='shortSortableRoot'
        as='ScrollView'
        scrollableBoundaryId='shortSortableScrollView'
        scrollableClassName='short-scroll-view'
        scrollableContentClassName='sortable-root short-sortable-root'
        scrollableStickyUpperOffset={12}
        scrollableStickyLowerOffset={12}
      >
        {renderSortableItem}
      </SortableRoot>

      <view className='outside-panel outside-panel--bottom'>
        <text className='outside-panel-title'>Content Below</text>
        <text className='outside-panel-copy'>
          Dragging near the panel edge should not react to this outside area.
        </text>
      </view>
    </view>
  )
}

root.render(<App />)
