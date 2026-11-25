// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  SheetSurfaceAlign,
  SheetSurfaceFrame,
  SheetSurfaceSize,
} from '../types'

export interface ParsedSurfaceSize {
  kind: 'px' | 'percent'
  value: number
}

export function normalizeInset(value: number | undefined) {
  return value !== undefined && Number.isFinite(value)
    ? Math.max(0, value)
    : 0
}

export function normalizeInsetMT(value: number | undefined) {
  'main thread'
  return value !== undefined && Number.isFinite(value)
    ? Math.max(0, value)
    : 0
}

export function parseSurfaceSize(
  size: SheetSurfaceSize | undefined,
): ParsedSurfaceSize | null {
  if (typeof size === 'number') {
    return Number.isFinite(size)
      ? { kind: 'px', value: Math.max(0, size) }
      : null
  }
  if (typeof size === 'string') {
    const trimmed = size.trim()
    if (trimmed.endsWith('%') && trimmed.length > 1) {
      const raw = trimmed.slice(0, -1).trim()
      if (!raw) return null
      const num = Number(raw)
      return Number.isFinite(num)
        ? { kind: 'percent', value: Math.max(0, num) }
        : null
    }
    if (trimmed.endsWith('px') && trimmed.length > 2) {
      const raw = trimmed.slice(0, -2).trim()
      if (!raw) return null
      const num = Number(raw)
      return Number.isFinite(num)
        ? { kind: 'px', value: Math.max(0, num) }
        : null
    }
  }
  return null
}

export function parseSurfaceSizeMT(
  size: SheetSurfaceSize | undefined,
): ParsedSurfaceSize | null {
  'main thread'
  if (typeof size === 'number') {
    return Number.isFinite(size)
      ? { kind: 'px', value: Math.max(0, size) }
      : null
  }
  if (typeof size === 'string') {
    const trimmed = size.trim()
    if (trimmed.endsWith('%') && trimmed.length > 1) {
      const raw = trimmed.slice(0, -1).trim()
      if (!raw) return null
      const num = Number(raw)
      return Number.isFinite(num)
        ? { kind: 'percent', value: Math.max(0, num) }
        : null
    }
    if (trimmed.endsWith('px') && trimmed.length > 2) {
      const raw = trimmed.slice(0, -2).trim()
      if (!raw) return null
      const num = Number(raw)
      return Number.isFinite(num)
        ? { kind: 'px', value: Math.max(0, num) }
        : null
    }
  }
  return null
}

export function resolveSurfaceSize(
  size: SheetSurfaceSize | undefined,
  basis: number,
): number | undefined {
  const parsed = parseSurfaceSize(size)
  if (!parsed) return undefined
  const safeBasis = Math.max(0, basis)
  return parsed.kind === 'px'
    ? parsed.value
    : (parsed.value / 100) * safeBasis
}

export function equalSurfaceSizeMT(
  a: ParsedSurfaceSize | null,
  b: ParsedSurfaceSize | null,
) {
  'main thread'
  if (a === b) return true
  if (!a || !b) return false
  return a.kind === b.kind && a.value === b.value
}

export function resolveHorizontalBounds(
  leftInset: number,
  rightInset: number,
  width: ParsedSurfaceSize | null,
  maxWidth: ParsedSurfaceSize | null,
  align: SheetSurfaceAlign,
  screenWidth: number,
  enableRTL: boolean,
): { left: number, width: number } {
  const safeScreenWidth = Math.max(0, screenWidth)
  const available = Math.max(0, safeScreenWidth - leftInset - rightInset)
  let resolvedWidth = available
  if (width !== null) {
    const px = width.kind === 'px'
      ? width.value
      : (width.value / 100) * safeScreenWidth
    resolvedWidth = Math.min(available, Math.max(0, px))
  }
  if (maxWidth !== null) {
    const maxPx = maxWidth.kind === 'px'
      ? maxWidth.value
      : (maxWidth.value / 100) * safeScreenWidth
    resolvedWidth = Math.min(resolvedWidth, Math.max(0, maxPx))
  }
  const slack = Math.max(0, available - resolvedWidth)
  let left = leftInset + slack / 2
  if (align === 'start') {
    left = enableRTL ? leftInset + slack : leftInset
  } else if (align === 'end') {
    left = enableRTL ? leftInset : leftInset + slack
  }
  return { left, width: resolvedWidth }
}

export function resolveHorizontalBoundsMT(
  leftInset: number,
  rightInset: number,
  width: ParsedSurfaceSize | null,
  maxWidth: ParsedSurfaceSize | null,
  align: SheetSurfaceAlign,
  screenWidth: number,
  enableRTL: boolean,
): { left: number, width: number } {
  'main thread'
  const safeScreenWidth = Math.max(0, screenWidth)
  const available = Math.max(0, safeScreenWidth - leftInset - rightInset)
  let resolvedWidth = available
  if (width !== null) {
    const px = width.kind === 'px'
      ? width.value
      : (width.value / 100) * safeScreenWidth
    resolvedWidth = Math.min(available, Math.max(0, px))
  }
  if (maxWidth !== null) {
    const maxPx = maxWidth.kind === 'px'
      ? maxWidth.value
      : (maxWidth.value / 100) * safeScreenWidth
    resolvedWidth = Math.min(resolvedWidth, Math.max(0, maxPx))
  }
  const slack = Math.max(0, available - resolvedWidth)
  let left = leftInset + slack / 2
  if (align === 'start') {
    left = enableRTL ? leftInset + slack : leftInset
  } else if (align === 'end') {
    left = enableRTL ? leftInset : leftInset + slack
  }
  return { left, width: resolvedWidth }
}

export function resolveSurfaceHorizontalFrame(
  frame: SheetSurfaceFrame | undefined,
  screenWidth: number,
  enableRTL = false,
): { left: number, width: number } | null {
  const parsedWidth = parseSurfaceSize(frame?.width)
  const parsedMaxWidth = parseSurfaceSize(frame?.maxWidth)
  const hasHorizontal = frame?.insets?.left !== undefined
    || frame?.insets?.right !== undefined
    || parsedWidth !== null
    || parsedMaxWidth !== null
  if (!hasHorizontal) return null
  const leftInset = normalizeInset(frame?.insets?.left)
  const rightInset = normalizeInset(frame?.insets?.right)
  const align = frame?.align ?? 'center'
  return resolveHorizontalBounds(
    leftInset,
    rightInset,
    parsedWidth,
    parsedMaxWidth,
    align,
    screenWidth,
    enableRTL,
  )
}
