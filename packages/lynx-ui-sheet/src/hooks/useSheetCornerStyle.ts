// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { MainThread } from '@lynx-js/types'

import type { SheetContentProps, SheetCornerRadius } from '../types'

export type CornerRadii = [
  topLeft: number | null,
  topRight: number | null,
  bottomRight: number | null,
  bottomLeft: number | null,
]

export interface InlineCornerStyles {
  borderRadius: string | undefined
  corners: [
    string | undefined,
    string | undefined,
    string | undefined,
    string | undefined,
  ]
}

export function normalizeCornerRadius(radius: number | undefined) {
  return radius !== undefined && Number.isFinite(radius)
    ? Math.max(0, radius)
    : null
}

export function normalizeCornerRadii(
  cornerRadius: SheetCornerRadius | undefined,
): CornerRadii {
  const scalar = typeof cornerRadius === 'number' ? cornerRadius : undefined
  const corners = typeof cornerRadius === 'object' ? cornerRadius : undefined
  return [
    normalizeCornerRadius(corners?.topLeft ?? scalar),
    normalizeCornerRadius(corners?.topRight ?? scalar),
    normalizeCornerRadius(corners?.bottomRight ?? scalar),
    normalizeCornerRadius(corners?.bottomLeft ?? scalar),
  ]
}

function normalizeCornerRadiusMT(radius: number | undefined) {
  'main thread'
  return radius !== undefined && Number.isFinite(radius)
    ? Math.max(0, radius)
    : null
}

export function normalizeCornerRadiiMT(
  cornerRadius: SheetCornerRadius | undefined,
): CornerRadii {
  'main thread'
  const scalar = typeof cornerRadius === 'number' ? cornerRadius : undefined
  const corners = typeof cornerRadius === 'object' ? cornerRadius : undefined
  return [
    normalizeCornerRadiusMT(corners?.topLeft ?? scalar),
    normalizeCornerRadiusMT(corners?.topRight ?? scalar),
    normalizeCornerRadiusMT(corners?.bottomRight ?? scalar),
    normalizeCornerRadiusMT(corners?.bottomLeft ?? scalar),
  ]
}

function styleLength(value: string | number | undefined) {
  return typeof value === 'number' ? `${value}px` : value
}

export function extractInlineCornerStyles(
  surfaceStyle?: SheetContentProps['style'],
): InlineCornerStyles {
  return {
    borderRadius: styleLength(surfaceStyle?.borderRadius),
    corners: [
      styleLength(surfaceStyle?.borderTopLeftRadius),
      styleLength(surfaceStyle?.borderTopRightRadius),
      styleLength(surfaceStyle?.borderBottomRightRadius),
      styleLength(surfaceStyle?.borderBottomLeftRadius),
    ],
  }
}

export function sameCornerRadii(a: CornerRadii | null, b: CornerRadii) {
  'main thread'
  if (!a) return false
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]
}

export function applySurfaceCornersMT(
  surface: MainThread.Element | null,
  radii: CornerRadii,
  previous: CornerRadii | null,
  inlineStyles: InlineCornerStyles,
  reapply = false,
): CornerRadii | null {
  'main thread'
  if (!surface) return previous
  if (!reapply && sameCornerRadii(previous, radii)) return previous
  const keys = [
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-right-radius',
    'border-bottom-left-radius',
  ]
  const borderRadius = inlineStyles.borderRadius
  const inlineCorners = inlineStyles.corners
  let restoreShorthand = false
  if (borderRadius != null && previous) {
    for (let index = 0; index < radii.length; index++) {
      if (radii[index] === null && previous[index] !== null) {
        restoreShorthand = true
        break
      }
    }
  }
  const styles: Record<string, string | null> = {}
  if (restoreShorthand && borderRadius != null) {
    styles['border-radius'] = borderRadius
  }
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index]
    const radius = radii[index]
    if (radius !== null) {
      if (reapply || restoreShorthand || radius !== previous?.[index]) {
        styles[key] = `${radius}px`
      }
    } else if (restoreShorthand) {
      const inline = inlineCorners[index]
      if (inline != null) styles[key] = inline
    } else if (previous?.[index] != null) {
      styles[key] = inlineCorners[index] ?? null
    }
  }
  if (Object.keys(styles).length > 0) {
    // The runtime accepts null to remove an inline value and restore the
    // stylesheet cascade. The public worklet declaration only lists strings.
    surface.setStyleProperties(styles as Record<string, string>)
  }
  return radii
}
