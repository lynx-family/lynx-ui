// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Switch } from '../ui/switch'

function ActSwitch() {
  return (
    <view className='size-full luna-gradient-berry flex flex-col justify-center items-center'>
      <view className='bg-canvas flex flex-col items-start gap-[12px] py-[128px] px-[84px] rounded-[36px]'>
        {/* Switch Demo Large */}
        <view className='flex flex-row items-center justify-start gap-[16px]'>
          <Switch defaultChecked size='lg' />
          <text className='text-start text-base text-content'>
            Illuminate
          </text>
        </view>
        <view className='flex flex-row items-center justify-start gap-[16px]'>
          <Switch size='lg' />
          <text className='text-start text-base text-content'>
            In Play
          </text>
        </view>
      </view>
    </view>
  )
}

export { ActSwitch }
