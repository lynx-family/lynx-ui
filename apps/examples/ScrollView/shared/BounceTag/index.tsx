// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import './index.css'

interface BounceTagProps {
  label: string
  variant: 'upper' | 'lower'
}

export function BounceTag(props: BounceTagProps) {
  const { label, variant } = props
  const lines = label.split(' ')

  return (
    <view className='bounce-tag'>
      <view className={`bounce-tag__surface bounce-tag__surface--${variant}`}>
        {lines.map((line, index) => (
          <text className='bounce-tag__text-line' key={`${line}-${index}`}>
            {line}
          </text>
        ))}
      </view>
    </view>
  )
}
