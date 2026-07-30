// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { MotionValue } from 'motion/react'
import { createContext } from 'react'
import type { Context } from 'react'

interface VisualSizeValue {
  visualW: MotionValue<number>
  visualH: MotionValue<number>
}

const VisualSizeContext: Context<VisualSizeValue | null> = createContext<
  VisualSizeValue | null
>(null)

export { VisualSizeContext }
export type { VisualSizeValue }
