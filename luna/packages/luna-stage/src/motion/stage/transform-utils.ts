// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

const NUM_SRC = String.raw`[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?`
const SCALE_SINGLE_RE = new RegExp(
  String.raw`^scale\(\s*(${NUM_SRC})(?:\s*,\s*(${NUM_SRC}))?\s*\)`,
  'i', // case-insensitive so "e" and "E" both work, avoids duplicate character class issues
)

/**
 * Parse the last occurrence of `scale(...)` from a CSS transform string.
 * Returns { x: ScaleX, y: ScaleY }; if not found, returns null.
 */
export function getLastScaleFromTransform(
  transform: string,
): { x: number, y: number } | null {
  if (!transform) return null

  // Find the last index of "scale(" (case-insensitive)
  const lower = transform.toLowerCase()
  const idx = lower.lastIndexOf('scale(')
  if (idx === -1) return null

  // Slice from the last "scale(" and extract numbers with a small regex
  const suffix = transform.slice(idx)
  const m = SCALE_SINGLE_RE.exec(suffix)
  if (!m) return null

  // m[1] is guaranteed by the regex pattern (required capture group)
  const sx = Number.parseFloat(m[1]!)
  const sy = m[2] === undefined ? sx : Number.parseFloat(m[2]) // if only one argument, sy = sx
  return { x: sx, y: sy }
}
