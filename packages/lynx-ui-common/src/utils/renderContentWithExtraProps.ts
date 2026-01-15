// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

export function renderContentWithExtraProps<T, U = { active: boolean }>(
  extraProps: T,
  renderFunction: ((innerProps: T & U) => ReactNode) | ReactNode,
) {
  const createContent = (
    extraProps: T,
    renderFunction: (innerProps: T & U) => ReactNode,
  ) =>
  (props: U) => renderFunction({ ...extraProps, ...props })

  return typeof renderFunction === 'function'
    ? createContent(extraProps, renderFunction)
    : renderFunction
}
