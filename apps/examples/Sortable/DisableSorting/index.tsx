// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import './index.css'

import type { SortableData } from '@lynx-js/lynx-ui-sortable'
import { SortableItem, SortableRoot } from '@lynx-js/lynx-ui-sortable'

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
          boundaryId='sortableContainer'
          data={data}
          onSortEnd={(sortedData: SortableData<string>[]) => {
            console.info('sortedData', sortedData)
            setData(sortedData)
          }}
          enableSorting={false}
        >
          {(item: SortableData<string>) => {
            return (
              <SortableItem
                className={`sortable-item ${
                  Number(item.dataItem) % 2 === 0
                    ? 'even'
                    : 'odd'
                }`}
                sortingKey={item.getSortingKey()}
              >
                <text>{item.dataItem}</text>
              </SortableItem>
            )
          }}
        </SortableRoot>
      </view>
    </view>
  )
}

root.render(<App />)
