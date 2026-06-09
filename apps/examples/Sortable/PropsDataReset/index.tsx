// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import './index.css'

import { SortableItem, SortableItemArea, SortableRoot } from '@lynx-js/lynx-ui'
import type { SortableData } from '@lynx-js/lynx-ui'

import type { SortableDemoItem } from '../shared/data'
import { createDemoData } from '../shared/data'

export function App() {
  const [values, setValues] = useState<SortableDemoItem[]>(
    () => createDemoData().map(item => item.dataItem),
  )
  const [renderCount, setRenderCount] = useState(0)

  const data = values.map(value => ({
    dataItem: value,
    getSortingKey: () => value.id,
  }))

  const triggerParentRerenders = () => {
    const rerenderDelays = [2000, 2500, 3000, 40000, 8000]
    rerenderDelays.forEach((delay) => {
      setTimeout(() => {
        setValues(currentValues => [...currentValues])
        setRenderCount(count => count + 1)
      }, delay)
    })
  }

  const handleSortEnd = (sortedData: SortableData<SortableDemoItem>[]) => {
    setValues(sortedData.map(item => item.dataItem))
    setTimeout(() => {
      setValues(currentValues => [...currentValues])
      setRenderCount(count => count + 1)
    }, 0)
  }

  return (
    <view
      className='sortable-root props-data-reset-root lunaris-dark'
      id='sortableContainer'
      // Required: establish a stacking context for sortable drag layers
      style={{ zIndex: '0' }}
    >
      <view className='props-data-reset-header'>
        <text className='props-data-reset-title'>
          Props Data Reset
        </text>
        <text className='props-data-reset-counter'>
          Rerenders: {renderCount}
        </text>
      </view>
      <SortableRoot
        data={data}
        boundaryId='sortableContainer'
        onSortStart={triggerParentRerenders}
        onSortEnd={handleSortEnd}
      >
        {(item: SortableData<SortableDemoItem>) => {
          const { id, tone } = item.dataItem

          return (
            <SortableItem
              key={item.getSortingKey()}
              as='DraggableRoot'
              className={`sortable-item sortable-item--${id}`}
              sortingKey={item.getSortingKey()}
            >
              <SortableItemArea className='sortable-item-area'>
                <text className={`drag-here-text drag-here-text--${tone}`}>
                  Drag Here
                </text>
              </SortableItemArea>
            </SortableItem>
          )
        }}
      </SortableRoot>
    </view>
  )
}

root.render(<App />)
