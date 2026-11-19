// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CSSProperties } from '@lynx-js/types'

import { alignments, getGapStyle } from '../shared/layout-style.js'
import { renderLayout } from '../shared/render-layout.js'
import type { FlexProps } from '../types/index.docs.js'

import './index.css'

const justifications = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
} as const

export function Flex(props: FlexProps) {
  const { direction, align, justify, wrap } = props
  const style: CSSProperties = { ...getGapStyle(props) }
  if (direction !== undefined) style.flexDirection = direction
  if (align !== undefined) style.alignItems = alignments[align]
  if (justify !== undefined) style.justifyContent = justifications[justify]
  if (wrap !== undefined) style.flexWrap = wrap
  return renderLayout(props, 'flex', style)
}
