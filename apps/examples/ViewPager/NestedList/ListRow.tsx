// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { SectionItem } from './data'

export function ListRow({ item }: { item: SectionItem }) {
  return (
    <list-item item-key={item.id}>
      <view className='row'>
        <text className='number'>
          {item.number}
        </text>
      </view>
    </list-item>
  )
}
