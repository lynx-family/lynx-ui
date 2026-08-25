// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useState } from 'react'

import { PageHeader } from '../components/PageHeader'
import { ThemeSelect } from '../components/tokens/ThemeSelect'
import { TokenComparisonTable } from '../components/tokens/TokenComparisonTable'
import { colorTokenCount, themeTokens } from '../data/tokens'

const DEFAULT_LEFT_THEME = 'luna-dark'
const DEFAULT_RIGHT_THEME = 'lunaris-dark'

function TokensPage() {
  const [leftThemeKey, setLeftThemeKey] = useState(DEFAULT_LEFT_THEME)
  const [rightThemeKey, setRightThemeKey] = useState(DEFAULT_RIGHT_THEME)
  const leftTheme = themeTokens.find(theme => theme.key === leftThemeKey)
  const rightTheme = themeTokens.find(theme => theme.key === rightThemeKey)

  if (leftTheme === undefined || rightTheme === undefined) {
    throw new Error('Selected token theme is unavailable.')
  }

  return (
    <div className='flex flex-col gap-10'>
      <PageHeader
        detail={`${colorTokenCount} semantic colors`}
        title='Color Tokens'
      />
      <section aria-label='Theme comparison' className='flex flex-col gap-5'>
        <div className='flex flex-wrap gap-4'>
          <ThemeSelect
            label='Left theme'
            onChange={setLeftThemeKey}
            value={leftThemeKey}
          />
          <ThemeSelect
            label='Right theme'
            onChange={setRightThemeKey}
            value={rightThemeKey}
          />
        </div>
        <TokenComparisonTable leftTheme={leftTheme} rightTheme={rightTheme} />
      </section>
    </div>
  )
}

export { TokensPage }
