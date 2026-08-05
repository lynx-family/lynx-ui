// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Choreography } from '@lynx-js/luna-studio'
import type { StudioViewMode } from '@lynx-js/luna-studio'
import { useState } from 'react'

import { lunaStudioDemoLayout, lunaStudioDemoModeGrid } from './layout'

const VIEW_MODES: StudioViewMode[] = ['compare', 'focus', 'lineup']

function LunaStudioDemo() {
  const [viewMode, setViewMode] = useState<StudioViewMode>('compare')

  return (
    <div className='flex h-screen w-screen flex-col bg-[#0d0d0d] text-white'>
      <div className='flex flex-none items-center justify-center gap-3 px-6 py-4'>
        {VIEW_MODES.map((mode) => {
          const active = mode === viewMode
          return (
            <button
              key={mode}
              className={[
                'rounded-full border px-4 py-2 text-sm capitalize transition-colors',
                active
                  ? 'border-white bg-white text-black'
                  : 'border-white/20 bg-transparent text-white',
              ].join(' ')}
              onClick={() => setViewMode(mode)}
              type='button'
            >
              {mode}
            </button>
          )
        })}
      </div>
      <div className='min-h-0 flex-1 p-6'>
        <Choreography
          className='h-full gap-4'
          layout={lunaStudioDemoLayout}
          modeGrid={lunaStudioDemoModeGrid}
          viewMode={viewMode}
        />
      </div>
    </div>
  )
}

export { LunaStudioDemo }
