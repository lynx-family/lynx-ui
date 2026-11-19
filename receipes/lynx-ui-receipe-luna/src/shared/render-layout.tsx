// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CSSProperties } from '@lynx-js/types'
import { clsx } from 'clsx'

import { getLayoutStyle } from './layout-style.js'
import type { LayoutProps } from '../types/index.docs.js'

export function renderLayout(
  props: LayoutProps,
  part: string,
  defaults: CSSProperties = {},
) {
  return (
    <view
      {...props.viewProps}
      className={clsx(`lynx-ui-receipe-luna__${part}`, props.className)}
      style={{ ...defaults, ...getLayoutStyle(props), ...props.style }}
    >
      {props.children}
    </view>
  )
}
