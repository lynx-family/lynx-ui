// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useEffect, useState } from '@lynx-js/react'

import { cn } from '../../utils'

import './pointer.css'

function ActDialog() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(true)
  }, [])

  return (
    <view className='relative size-full bg-primary-muted flex flex-col items-center justify-center px-[24px]'>
      {/* Dialog Trigger */}
      <view
        className={cn(
          'w-[240px] h-[48px] flex justify-center items-center rounded-full',
          'bg-neutral active:bg-neutral-2 transition-colors',
          !open && 'pointer-events-auto',
        )}
        bindtap={() => setOpen(true)}
      >
        <text className='text-neutral-content font-semibold text-base'>
          Let the Dialog appear
        </text>
      </view>
      {/* Dialog Backdrop */}
      <view
        className={cn(
          'fixed z-10 inset-0 bg-backdrop',
          'transition-all duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]',
          open ? 'opacity-100' : 'opacity-0',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        bindtap={() => setOpen(false)}
        user-interaction-enabled={open}
      />
      <view className='relative z-20 h-0 w-0 p-0 transform-[translateY(-24px)] overflow-visible'>
        {/* Dialog Content */}
        <view
          className={cn(
            'absolute w-[320px] h-[288px] transform-[translate(-50%,-50%)] p-[24px] flex flex-col gap-[24px] justify-center items-center',
            'bg-canvas border-line border rounded-[24px]',
            open ? 'opacity-100 duration-150' : 'opacity-0 duration-120',
            open ? 'pointer-events-auto' : 'pointer-events-none',
            'transition-all ease-[cubic-bezier(0.22,0.61,0.36,1)]',
          )}
          user-interaction-enabled={open}
        >
          <view className='w-full flex flex-col items-start justify-center px-[32px] gap-[12px]'>
            <text className='text-content text-lg font-semibold'>
              Step into the next phase
            </text>
            <text className='text-content-muted text-base'>
              This action will shift your current state. Nothing drastic, just a
              subtle drift, like moonlight sliding across a quiet surface.
            </text>
          </view>
          {/* Dialog Action */}
          <view
            className={cn(
              'z-50 w-4/5 h-[48px] flex justify-center items-center rounded-full',
              'bg-primary active:bg-primary-2 transition-colors',
              open ? 'pointer-events-auto' : 'pointer-events-none',
            )}
            bindtap={() => setOpen(false)}
            user-interaction-enabled={open}
          >
            <text className='text-primary-content font-semibold text-base'>
              Proceed
            </text>
          </view>
        </view>
      </view>
    </view>
  )
}

export { ActDialog }
