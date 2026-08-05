// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import '@lynx-js/react/debug'
import { root } from '@lynx-js/react'

import { AppTheme } from '../App.js'
import { ActTwo } from '../components/act-two'

export function App() {
  return (
    <AppTheme preset='luna-dark'>
      <ActTwo />
    </AppTheme>
  )
}

root.render(<App />)

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
}
