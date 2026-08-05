// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import '@lynx-js/react/debug'
import { root } from '@lynx-js/react'

import { ActBloom } from '../components/act-bloom'

import '../App.css'

export function App() {
  return (
    <ActBloom
      lunaTheme={lynx.__globalProps.lunaTheme ?? 'lunaris-light'}
      studioViewMode={lynx.__globalProps.studioViewMode ?? 'focus'}
      studioFocusKey={lynx.__globalProps.studioFocusKey ?? 'button'}
    />
  )
}

root.render(<App />)

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
}
