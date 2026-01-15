// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CSSProperties } from '@lynx-js/types'

export type * from './BaseScrollEvents'
export type * from './BaseUIEvents'
export type * from './BaseUIProps'
export type * from './BounceableInterface'
export type * from './LazyInterface'
export type * from './RefreshInterface'

export interface Point {
  x: number
  y: number
}

export interface Rect {
  width: number
  height: number
  left: number
  top: number
}

// TODO(fangzhou.fz): add id if it becomes necessary in the future
export interface ComponentBasicProps {
  /**
   * className
   * @zh 类名
   * @Android
   * @iOS
   * @Harmony
   */
  className?: string
  /**
   * style
   * @zh 样式
   * @Android
   * @iOS
   * @Harmony
   */
  style?: CSSProperties
}
