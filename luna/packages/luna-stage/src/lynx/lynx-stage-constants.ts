// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CSSProperties } from 'react'

import type { CSSVarProperties } from '../types/lynx-view'

// Container-relative unit hooks for Lynx runtime:
// - `containerType: 'size'` enables `cqw/cqh` units based on the host element box.
// - `--vh-unit/--vw-unit` make `vh/vw` behave like "container viewport" inside `<lynx-view>`.
// - `--rpx-unit` aligns `rpx` scaling with a 750-wide design baseline (mobile-like behavior).
// Note: web-core already applies `contain: content` internally; combined with `containerType: 'size'`
// this effectively behaves like `contain: strict` without us overriding containment explicitly.
export const LYNX_VIEW_STYLE: CSSProperties & CSSVarProperties = {
  width: '100%',
  height: '100%',
  pointerEvents: 'auto',
  containerType: 'size',
  '--rpx-unit': 'calc(100cqw / 750)',
  '--vh-unit': '1cqh',
  '--vw-unit': '1cqw',
}

export const LYNX_VIEW_STYLE_INTERACTIVE: CSSProperties & CSSVarProperties = {
  ...LYNX_VIEW_STYLE,
  pointerEvents: 'auto',
}

export const LYNX_VIEW_STYLE_NON_INTERACTIVE: CSSProperties & CSSVarProperties =
  {
    ...LYNX_VIEW_STYLE,
    pointerEvents: 'none',
  }

export const CONTAINER_STYLE: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
}

export const DEFAULT_GROUP_ID = 7
