// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useCallback, useState } from '@lynx-js/react'

import './index.css'

import {
  Button,
  SortableItem,
  SortableItemArea,
  SortableRoot,
} from '@lynx-js/lynx-ui'
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
              <text
                className={`sortable-item-subtitle sortable-item-subtitle--${tone}`}
              >
                Drag within this short scroll area
              </text>
            </view>
            <SortableItemArea className='sortable-item-area'>
              <text className={`drag-here-text drag-here-text--${tone}`}>
                Drag Here
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
    <view className='demo-container lunaris-dark'>
      <view className='scroll-boundary-info'>
        <text className='scroll-boundary-info-title'>
          Above the Scroll Boundary
        </text>
        <text className='scroll-boundary-info-description'>
          This panel sits outside the sortable scroll area below.
        </text>
      </view>

      <view className='scroll-controls'>
        <Button
          className='scroll-control-button'
          buttonProps={{
            'main-thread:bindtap': handleScrollUpTap,
          }}
        >
          <text className='scroll-control-label'>Scroll Up</text>
        </Button>
        <Button
          className='scroll-control-button scroll-control-button--primary'
          buttonProps={{
            'main-thread:bindtap': handleScrollDownTap,
          }}
        >
          <text className='scroll-control-label'>Scroll Down</text>
        </Button>
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

      <view className='scroll-boundary-info'>
        <text className='scroll-boundary-info-title'>
          Below the Scroll Boundary
        </text>
        <text className='scroll-boundary-info-description'>
          Dragging near this panel should not trigger sortable auto-scroll.
        </text>
      </view>
    </view>
  )
}

root.render(<App />)
