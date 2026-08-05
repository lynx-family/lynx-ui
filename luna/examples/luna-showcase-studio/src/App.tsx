// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import './App.css'
import { Studio } from './components/studio'
import { cn } from './utils'

const RECORD_MODE = false

function App() {
  return (
    <div className='relative text-black flex h-screen w-screen overflow-hidden leading-normal text-center flex-col'>
      {!RECORD_MODE && (
        <div className='w-full flex-none flex flex-row items-end h-32 gap-x-8 justify-center'>
          <h1 className='text-5xl font-normal'>L.U.N.A</h1>
          <p className='text-start font-light -translate-y-[2px]'>
            <i>
              Lynx UI New Aesthetics
            </i>
          </p>
        </div>
      )}
      <div
        className={cn(
          'relative flex justify-center items-center min-h-0',
          RECORD_MODE ? 'w-[1640px] h-[805px]' : 'w-full flex-1',
        )}
      >
        <div
          className={cn(
            'relative w-full flex justify-center items-center translate-y-6',
            RECORD_MODE ? 'h-full' : ' h-3/4',
          )}
        >
          <Studio className={RECORD_MODE ? 'py-24' : 'py-10'} />
        </div>
      </div>
    </div>
  )
}

export default App
