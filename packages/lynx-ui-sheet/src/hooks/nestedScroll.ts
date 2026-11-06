// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export interface ResolveNestedScrollOwnerOptions {
  /** Positive expands the Sheet; negative collapses it, independent of side. */
  delta: number
  /** Visible Sheet size in pixels. */
  position: number
  /** The maximum visible Sheet size. */
  maximumPosition: number
  /** Whether the scrolling content is synchronously known to be at its start. */
  contentAtStart?: boolean
}

/**
 * Resolve the fixed, natural nested-scroll policy:
 * expanding drags move the Sheet to its maximum position before content scrolls;
 * collapsing drags remain in content until it reaches its start.
 * @internal
 */
export function resolveNestedScrollOwner({
  delta,
  position,
  maximumPosition,
  contentAtStart,
}: ResolveNestedScrollOwnerOptions): 'sheet' | 'content' {
  'main thread'
  if (delta > 0) return position < maximumPosition ? 'sheet' : 'content'
  if (delta < 0) return contentAtStart === true ? 'sheet' : 'content'
  return 'content'
}
