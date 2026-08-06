// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

interface LyricBlockProps {
  lines: string[]
  artist?: string
  title?: string
}

export function LyricBlock({ lines, artist, title }: LyricBlockProps) {
  return (
    <view className='w-full flex flex-col gap-[10px]'>
      <view className='flex flex-col items-start justify-center gap-[2px]'>
        {lines.map((line, i) => (
          <text
            key={i}
            className='text-base text-primary-content opacity-50 transition-colors duration-300 ease-in-out'
          >
            {line}
          </text>
        ))}
      </view>

      {artist && (
        <view className='flex flex-col items-start justify-center self-end'>
          <text className='text-base text-primary-content opacity-50 pt-[4px] transition-colors duration-300 ease-in-out'>
            {title ? `${title} by ` : ''}
            <text className='text-base text-primary-content font-semibold transition-colors duration-300 ease-in-out'>
              {artist}
            </text>
          </text>
        </view>
      )}
    </view>
  )
}
