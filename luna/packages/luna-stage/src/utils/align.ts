// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { AlignX, AlignY } from '../types'

export function toAlignFactor(alignment?: AlignX | AlignY): number {
  switch (alignment) {
    case 'left':
    case 'top':
      return 0
    case 'right':
    case 'bottom':
      return 1
    default:
      return 0.5
  }
}
