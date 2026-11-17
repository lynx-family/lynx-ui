// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CSSProperties } from '@lynx-js/types'

import { alignments, getGapStyle } from '../shared/layout-style.js'
import { renderLayout } from '../shared/render-layout.js'
import type { GridProps } from '../types/index.docs.js'

import './index.css'

function resolveTracks(value: number | string | undefined) {
  if (value === undefined) return undefined
  if (typeof value === 'number' || /^\d+$/.test(value)) {
    const count = Number(value)
    if (!Number.isSafeInteger(count) || count < 1) {
      throw new RangeError('Grid track counts must be positive integers.')
    }
    return `repeat(${count}, 1fr)`
  }
  return value
}

export function Grid(props: GridProps) {
  const { columns, rows, flow, align, justify } = props
  const style: CSSProperties = { ...getGapStyle(props) }
  if (columns !== undefined) style.gridTemplateColumns = resolveTracks(columns)
  if (rows !== undefined) style.gridTemplateRows = resolveTracks(rows)
  if (flow !== undefined) style.gridAutoFlow = flow
  if (align !== undefined) style.alignItems = alignments[align]
  if (justify !== undefined) style.justifyItems = justify
  return renderLayout(props, 'grid', style)
}
