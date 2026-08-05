// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useState } from '@lynx-js/react'

import { cn } from '../../utils'

function ActOne() {
  const [snapIndex, setSnapIndex] = useState(1)

  const handleTap = () => {
    setSnapIndex(prev => (prev + 1) % 3)
  }

  return (
    <view className='size-full flex flex-col justify-center items-center'>
      <view className='absolute h-full w-full luna-gradient' />
      <view
        className={cn(
          'absolute -bottom-1/3 h-full w-full bg-canvas rounded-t-[36px] transition-all ease-in-out duration-500',
          snapIndex === 0 && 'transform-[translateY(33.3%)]',
          snapIndex === 2 && 'transform-[translateY(-20%)]',
        )}
        bindtap={handleTap}
      >
      </view>
    </view>
  )
}

export { ActOne }
