// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CSSProperties } from '@lynx-js/types'

import type { LayoutProps, Space } from './types/index.docs.js'

const spacing = [0, 4, 8, 12, 16, 24, 32, 40, 48, 64] as const

export function resolveSpace(value: Space | undefined) {
  if (value === undefined) return undefined
  if (typeof value === 'number') return `${value}px`
  if (/^\d$/.test(value)) return `${spacing[Number(value)]}px`
  return value
}

export function getLayoutStyle(props: LayoutProps): CSSProperties {
  const style: CSSProperties = {}
  const dimensions = [
    'width',
    'minWidth',
    'maxWidth',
    'height',
    'minHeight',
    'maxHeight',
    'flexGrow',
    'flexShrink',
    'flexBasis',
  ] as const
  for (const key of dimensions) {
    const value = props[key]
    if (value !== undefined) style[key] = value
  }
  const sides = [
    ['paddingTop', props.pt ?? props.py ?? props.p],
    ['paddingRight', props.pr ?? props.px ?? props.p],
    ['paddingBottom', props.pb ?? props.py ?? props.p],
    ['paddingLeft', props.pl ?? props.px ?? props.p],
    ['marginTop', props.mt ?? props.my ?? props.m],
    ['marginRight', props.mr ?? props.mx ?? props.m],
    ['marginBottom', props.mb ?? props.my ?? props.m],
    ['marginLeft', props.ml ?? props.mx ?? props.m],
  ] as const
  for (const [key, value] of sides) {
    if (value !== undefined) style[key] = resolveSpace(value)
  }
  return style
}

export function getGapStyle(
  props: { gap?: Space, gapX?: Space, gapY?: Space },
): CSSProperties {
  const style: CSSProperties = {}
  const horizontal = props.gapX ?? props.gap
  const vertical = props.gapY ?? props.gap
  if (horizontal !== undefined) style.columnGap = resolveSpace(horizontal)
  if (vertical !== undefined) style.rowGap = resolveSpace(vertical)
  return style
}

export function resolveTracks(value: number | string | undefined) {
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
