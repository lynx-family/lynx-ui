// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { cn } from '../../utils'
import { Checkbox } from '../ui/checkbox'

function ActCheckbox() {
  return (
    <view className='absolute size-full luna-gradient-ocean flex flex-col justify-center items-center'>
      <view className='bg-canvas flex flex-col items-start gap-[24px] px-[84px] py-[128px] rounded-[16px] overflow-hidden'>
        {/* Checkbox Demo Medium */}
        <view className='flex flex-col items-start gap-[10px]'>
          <view className='flex flex-row items-center gap-[10px]'>
            <Checkbox defaultChecked size='md' />
            <text className='text-base text-content-2'>
              awakened
            </text>
          </view>
          <view
            className={cn(
              'flex flex-row items-center gap-[10px]',
            )}
          >
            <Checkbox size='md' />
            <text className='text-base text-content-2'>
              sleep
            </text>
          </view>
        </view>
        <view
          className={'flex flex-col items-start gap-[10px]'}
        >
          {/* Checkbox Demo Small */}
          <view className='flex flex-row items-center gap-[10px]'>
            <Checkbox defaultChecked />
            <text className='text-p2 text-content-2'>
              awakened
            </text>
          </view>
          <view
            className={cn(
              'flex flex-row items-center gap-[10px]',
            )}
          >
            <Checkbox />
            <text className='text-p2 text-content-2'>
              sleep
            </text>
          </view>
        </view>
      </view>
    </view>
  )
}

export { ActCheckbox }
