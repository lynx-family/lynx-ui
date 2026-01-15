// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CSSProperties } from '@lynx-js/types'

export interface EnableLazyMode {
  /**
   * When enabled, only the items that are about to enter the viewport are rendered, reducing initial load time and memory usage; remaining items are rendered as they approach visibility during scroll.
   * @zh 启用懒渲染。只有当用户滚动到可见区域时，才会渲染 items，从而减少初始加载时间和内存使用。
   * @defaultValue true
   * @Android
   * @iOS
   */
  enableLazy: boolean
  /**
   * Be used to mark the exposure timing of lazy loading. Please ensure that it is unique throughout the page.
   * @zh 用于标记懒加载的曝光时机。请确保在整个页面中是唯一的。
   * @defaultValue undefined
   * @Android
   * @iOS
   */
  scene: string
  /**
   * Estimated height and width of the items need to be set.
   * @zh 需要设置项目的预估高度和宽度。
   * @defaultValue undefined
   * @Android
   * @iOS
   */
  estimatedItemStyle: CSSProperties
  /**
   * exposure-screen-margin-top
   * @zh 曝光屏幕上边距
   * @defaultValue '10px'
   * @Android
   * @iOS
   */
  exposureTop?: `${number}px` | `${number}rpx`
  /**
   * exposure-screen-margin-bottom
   * @zh 曝光屏幕下边距
   * @defaultValue '10px'
   * @Android
   * @iOS
   */
  exposureBottom?: `${number}px` | `${number}rpx`
  /**
   * exposure-screen-margin-left
   * @zh 曝光屏幕左边距
   * @defaultValue '10px'
   * @Android
   * @iOS
   */
  exposureLeft?: `${number}px` | `${number}rpx`
  /**
   * exposure-screen-margin-right
   * @zh 曝光屏幕右边距
   * @defaultValue '10px'
   * @Android
   * @iOS
   */
  exposureRight?: `${number}px` | `${number}rpx`
  /**
   * Estimated first screen item count for lazy rendering. Remaining children will complete rendering based on exposure. When this estimate is small, it may cause a blank screen phenomenon where some nodes exist on the first screen.
   * @zh 懒加载的首屏预估 item 数量。剩余子节点将根据曝光情况完成渲染。当此预估值较小时，可能会导致首屏存在部分节点白屏的现象。
   * @defaultValue 1
   * @Android
   * @iOS
   */
  firstScreenItemCount?: number
}

export interface DisableLazyMode {
  enableLazy: false
}

export type LazyOptions = EnableLazyMode | DisableLazyMode
