// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { NativeGesture } from '@lynx-js/gesture-runtime'

import type { SheetGestureContextValue } from '../context'

/** @internal */
export function getSheetScrollGesture(
  context: SheetGestureContextValue,
): NativeGesture {
  if (!context.scrollGesture) {
    throw new Error(
      'useSheetScrollGesture must be used inside SheetGestureContent',
    )
  }
  return context.scrollGesture as NativeGesture
}
