// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

function render<T>(
  api: T,
  children: ((api: T) => ReactNode) | ReactNode,
): ReactNode {
  return typeof children === 'function'
    ? (children as (api: T) => ReactNode)(api)
    : children
}

export { render }
