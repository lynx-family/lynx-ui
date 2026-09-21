// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { SheetNestedScrollBehavior } from '../types'

export interface ResolveNestedScrollOwnerOptions {
  behavior: SheetNestedScrollBehavior
  delta: number
  position: number
  handoffPosition: number
  contentAtStart: boolean
  contentAtEnd: boolean
}

/** @internal */
export function resolveNestedScrollOwner({
  behavior,
  delta,
  position,
  handoffPosition,
  contentAtStart,
  contentAtEnd,
}: ResolveNestedScrollOwnerOptions): 'sheet' | 'content' {
  'main thread'
  if (behavior === 'disabled') return 'content'
  if (delta < 0) return contentAtStart ? 'sheet' : 'content'
  if (delta > 0) {
    if (behavior === 'content-first' && !contentAtEnd) return 'content'
    return position < handoffPosition ? 'sheet' : 'content'
  }
  return 'content'
}
