// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { renderLayout } from '../shared/render-layout.js'
import type { BoxProps } from '../types/index.docs.js'

export function Box(props: BoxProps) {
  return renderLayout(props, 'box')
}
