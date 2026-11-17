// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { renderLayout } from '../shared/render-layout.js'
import type { ContainerProps } from '../types/index.docs.js'

import './index.css'

export function Container({ size = '4', ...props }: ContainerProps) {
  return renderLayout(props, `container-${size}`)
}
