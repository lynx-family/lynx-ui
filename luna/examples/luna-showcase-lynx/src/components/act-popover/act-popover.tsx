// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useEffect, useState } from '@lynx-js/react'

import { EllipsisIcon } from './ellipsis-icon'
import { OptionsMenu } from './options-menu'
import { cn } from '../../utils'

import './pointer.css'

function ActPopover() {
  const [open, setOpen] = useState(false)

  const handleToggle = () => setOpen(prev => !prev)

  useEffect(() => {
    setOpen(true)
  }, [])

  return (
    <view className='relative size-full luna-gradient-afterglow flex flex-col justify-center items-center gap-[24px] px-[48px] pb-[160px]'>
      <view
        className={cn(
          'relative self-end w-[44px] h-[44px] rounded-full bg-neutral flex items-center justify-center shadow active:opacity-80',
        )}
        bindtap={handleToggle}
      >
        <EllipsisIcon size='md' />
      </view>

      <view className='relative self-start flex flex-col justify-between items-start'>
        <view className='relative h-[48px] px-[24px] rounded-[24px] bg-canvas shadow flex items-center justify-center'>
          <text className='text-content text-base'>Anchor</text>
        </view>
        <view
          className={cn(
            'fixed z-10 inset-0 bg-backdrop-subtle opacity-0 transition-all ease-[cubic-bezier(0.22,0.61,0.36,1)] duration-150',
            open && 'opacity-100',
            open ? 'pointer-events-auto' : 'pointer-events-none',
          )}
          bindtap={() => setOpen(false)}
          user-interaction-enabled={open}
        />
        <view className='relative z-50 h-0 w-0 p-0 transform-[translateY(12px)] overflow-visible'>
          <view
            bindtap={() => setOpen(false)}
            user-interaction-enabled={open}
            className={cn(
              'absolute w-[264px] min-h-[192px] rounded-[24px] bg-paper shadow-lg',
              'transition-all duration-150 ease-[cubic-bezier(0.22,0.61,0.36,1)] origin-top-left',
              open
                ? 'opacity-100 transform-[translateY(0)_scale(1)]'
                : 'opacity-0 duration-120 transform-[translateY(-16px)_scale(0)]',
            )}
          >
            <view className='w-full px-[36px] py-[24px]'>
              <OptionsMenu />
            </view>
          </view>
        </view>
      </view>
    </view>
  )
}

export { ActPopover }
