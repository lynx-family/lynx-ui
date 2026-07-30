// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { LunaTheme } from '@lynx-js/luna-reactlynx/runtime'

import { Button } from './Button.js'

import './App.css'

export function App() {
  // LunaTheme applies the resolved LUNA theme class to its wrapper.
  return (
    <LunaTheme themeKey='lunaris-dark'>
      <view className='container'>
        {/* Button Demo */}
        <Button>Let it bloom</Button>
        <Button variant='secondary'>
          Stay asleep
        </Button>
      </view>
    </LunaTheme>
  )
}
