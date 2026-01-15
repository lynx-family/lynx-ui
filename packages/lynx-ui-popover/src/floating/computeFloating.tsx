// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { computePosition } from './computePosition'
import type {
  ComputePositionConfig,
  ComputePositionReturn,
  ElementRects,
  Middleware,
  Placement,
  Platform,
} from './floatingTypes'

interface ComputeFloatingOptions {
  placement?: Placement
  middleware?: Array<Middleware | null | undefined | false> | undefined
  platform: Platform
  elements: ElementRects
  open?: boolean | undefined
  transform?: boolean | undefined
}

export function computeFloating(
  options: ComputeFloatingOptions,
): Promise<ComputePositionReturn> {
  const {
    placement = 'bottom',
    middleware = [],
    platform,
    elements,
  } = options

  const config: ComputePositionConfig = {
    placement,
    platform,
    middleware,
  }

  const { reference, floating, alternativeReference } = elements

  return computePosition(
    alternativeReference ?? reference,
    floating,
    config,
  )
}
