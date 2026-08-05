// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

function ActTwo() {
  return (
    <view className='size-full flex flex-col justify-center items-center bg-canvas transition-colors duration-300 ease-in-out'>
      <text className='absolute text-2xl text-content'>
        L.U.N.A Stage
      </text>
      <view className='absolute flex flex-col justify-end items-center w-full px-[36px] pb-[48px] bottom-0 gap-[4px]'>
        <view className='flex flex-row justify-center items-center rounded-full h-[64px] w-full bg-neutral active:bg-neutral-2'>
          <text className='text-base text-neutral-content'>Continue</text>
        </view>
      </view>
    </view>
  )
}

export { ActTwo }
