// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CSSProperties } from '@lynx-js/types'
import { clsx } from 'clsx'

import { getGapStyle, getLayoutStyle, resolveTracks } from './layout-style.js'
import type {
  BoxProps,
  ColumnProps,
  ContainerProps,
  FlexProps,
  GridProps,
  LayoutProps,
  RowProps,
  SectionProps,
} from './types/index.docs.js'

import './layout.css'

const alignments = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  baseline: 'baseline',
  stretch: 'stretch',
} as const

const justifications = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
} as const

function renderLayout(
  props: LayoutProps,
  part: string,
  defaults: CSSProperties = {},
) {
  return (
    <view
      {...props.viewProps}
      className={clsx(`lynx-ui-receipe-luna__${part}`, props.className)}
      style={{ ...defaults, ...getLayoutStyle(props), ...props.style }}
    >
      {props.children}
    </view>
  )
}

export function Box(props: BoxProps) {
  return renderLayout(props, 'box')
}

export function Flex(props: FlexProps) {
  const { direction, align, justify, wrap } = props
  const style: CSSProperties = { ...getGapStyle(props) }
  if (direction !== undefined) style.flexDirection = direction
  if (align !== undefined) style.alignItems = alignments[align]
  if (justify !== undefined) style.justifyContent = justifications[justify]
  if (wrap !== undefined) style.flexWrap = wrap
  return renderLayout(props, 'flex', style)
}

export function Row(props: RowProps) {
  return <Flex {...props} direction='row' />
}

export function Column(props: ColumnProps) {
  return <Flex {...props} direction='column' />
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

export function Container({ size = '4', ...props }: ContainerProps) {
  return renderLayout(props, `container-${size}`)
}

export function Section({ size = '2', ...props }: SectionProps) {
  return renderLayout(props, `section-${size}`)
}
