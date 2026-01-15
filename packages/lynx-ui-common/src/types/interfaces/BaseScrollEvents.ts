// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  ScrollViewProps as OriginalScrollViewProps,
  ScrollEvent,
} from '@lynx-js/types'

export interface BaseScrollEvents {
  /**
   * Being triggered when scrolling occurs.
   * @zh 滚动时触发。
   * @defaultValue undefined
   * @eventProperty
   * @Android
   * @iOS
   */
  onScroll?: (e: ScrollEvent) => void
  /**
   * Being triggered when scrolling stops.
   * @zh 滚动停止时触发。
   * @defaultValue undefined
   * @eventProperty
   * @Android
   * @iOS
   */
  onScrollEnd?: (e: OriginalScrollViewProps['bindscrollend']) => void
  /**
   * Being triggered when scrolling to upper.
   * @zh 滚动到顶部时触发。
   * @defaultValue undefined
   * @eventProperty
   * @Android
   * @iOS
   */
  onScrollToUpper?: (e: OriginalScrollViewProps['bindscrolltoupper']) => void
  /**
   * Being triggered when scrolling to lower.
   * @zh 滚动到底部时触发。
   * @defaultValue undefined
   * @eventProperty
   * @Android
   * @iOS
   */
  onScrollToLower?: (e: OriginalScrollViewProps['bindscrolltolower']) => void
}
