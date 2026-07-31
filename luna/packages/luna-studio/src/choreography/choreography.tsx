// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { LayoutGroup } from 'motion/react'
import type { JSX } from 'react'

import { ChoreographyView } from './choreography-view'
import type { ChoreographyProps } from '../types'

/**
 * Public choreography wrapper that provides a stable entry point over `ChoreographyView`.
 * It adapts `viewMode` to the internal `mode` prop and scopes Motion layout
 * coordination with a dedicated `LayoutGroup`.
 */
function Choreography({
  viewMode = 'compare',
  ...choreographyViewProps
}: ChoreographyProps): JSX.Element {
  return (
    <LayoutGroup id='luna-studio'>
      <ChoreographyView
        {...choreographyViewProps}
        mode={viewMode}
        key='luna-studio-choreography-view'
      />
    </LayoutGroup>
  )
}

export { Choreography }
