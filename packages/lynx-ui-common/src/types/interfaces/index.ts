// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CSSProperties } from '@lynx-js/types'

export type * from './BaseScrollEvents'
export type * from './BaseUIEvents'
export type * from './BaseUIProps'
export type * from './LazyInterface'

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

export interface ComponentBasicProps {
  /**
   * Identifier applied to the component's root element.
   * @zh 应用于组件根元素的标识符。
   * @Android
   * @iOS
   * @Harmony
   */
  id?: string
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
