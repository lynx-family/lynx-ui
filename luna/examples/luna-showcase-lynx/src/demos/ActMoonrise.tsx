// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import '@lynx-js/react/debug'
import { root } from '@lynx-js/react'

import { AppTheme } from '../App.js'
import { ActMoonrise } from '../components/act-moonrise'

export function App() {
  return (
    <AppTheme preset={lynx.__globalProps.lunaTheme ?? 'luna-light'}>
      <ActMoonrise
        studioViewMode={lynx.__globalProps.studioViewMode ?? 'compare'}
        studioThemeKey={lynx.__globalProps.studioThemeKey
          ?? lynx.__globalProps.lunaTheme
          ?? 'luna-light'}
        studioAutoplay={lynx.__globalProps.studioAutoplay ?? false}
      />
    </AppTheme>
  )
}

root.render(<App />)

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept()
}
