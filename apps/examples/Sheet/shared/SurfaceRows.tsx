// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export function SurfaceRows() {
  return Array.from(
    { length: 16 },
    (_, index) => (
      <view className='surface-row' key={index}>
        <text className='surface-row-title'>{`Chapter ${index + 1}`}</text>
        <text className='surface-row-copy'>
          Keep reading as the panel changes size. The text stays at its natural
          size and wraps to the available width.
        </text>
      </view>
    ),
  )
}
