// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

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

  return (
    <view className='sortable-root'>
      <view id='sortableContainer' style={{ zIndex: '0' }}>
        <SortableRoot
          data={data}
          onSortEnd={(sortedData: SortableData<string>[]) => {
            console.info('sortedData', sortedData)
            setData(sortedData)
          }}
          boundaryId='sortableContainer'
        >
          {(item: SortableData<string>) => {
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
          }}
        </SortableRoot>
      </view>
    </view>
  )
}

root.render(<App />)
