// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { RadioGroup, RadioItem } from '../ui/radio-group'

function ActRadioGroup() {
  return (
    <view className='absolute size-full luna-gradient-rose flex flex-col justify-center items-center'>
      <view className='bg-canvas flex flex-col justify-center items-start gap-[48px] px-[60px] py-[80px] rounded-[16px]'>
        <RadioGroup
          className='flex flex-col items-start gap-[16px]'
          defaultValue='sink'
        >
          {/* Radio Group Demo Medium */}
          <view className='flex flex-row items-center gap-[10px]'>
            <RadioItem value='drift' size='md' />
            <text className='text-start text-lg text-content-2 font-medium'>
              Drift
            </text>
          </view>
          <view className='flex flex-row items-center gap-[10px]'>
            <RadioItem value='sink' size='md' />
            <text className='text-start text-lg  text-content-2 font-medium'>
              Sink
            </text>
          </view>
          <view className='flex flex-row items-center gap-[10px]'>
            <RadioItem value='wake' size='md' />
            <text className='text-start text-lg text-content-2 font-medium'>
              Wake
            </text>
          </view>
        </RadioGroup>
        <RadioGroup
          className={'flex flex-col items-start gap-[16px]'}
          defaultValue='drift'
        >
          {/* Radio Group Demo Small */}
          <view className='flex flex-row items-center gap-[10px]'>
            <RadioItem value='drift' />
            <text className='text-start text-base text-content-muted font-medium'>
              Drift
            </text>
          </view>
          <view className='flex flex-row items-center gap-[10px]'>
            <RadioItem value='sink' />
            <text className='text-start text-base  text-content-muted font-medium'>
              Sink
            </text>
          </view>
          <view className='flex flex-row items-center gap-[10px]'>
            <RadioItem value='wake' />
            <text className='text-start text-base text-content-muted font-medium'>
              Wake
            </text>
          </view>
        </RadioGroup>
      </view>
    </view>
  )
}

export { ActRadioGroup }
