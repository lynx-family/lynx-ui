// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactElement } from '@lynx-js/react'

export interface scrollToBouncesInfo {
  direction: 'upper' | 'lower'
}

export interface BounceableBasicProps {
  /**
   * Whether to enable bounce effect
   * @zh 是否开启回弹效果
   * @iOS
   * @Android
   * @Harmony
   */
  enableBounces: boolean
  /**
   * Trigger bounces effect during fling
   * @zh 在快速滑动（fling）时触发回弹效果
   * @defaultValue false
   * @iOS
   * @Android
   * @Harmony
   */
  enableBounceEventInFling?: boolean
  /**
   * The threshold distance of upper bounces, in pixels, when triggering the scrollToBounces event
   * @zh 触发 `scrollToBounces` 事件时，上部回弹的阈值距离（单位：px）
   * @defaultValue 0
   * @iOS
   * @Android
   * @Harmony
   */
  startBounceTriggerDistance?: number
  /**
   * The threshold distance of lower bounces, in pixels, when triggering the scrollToBounces event
   * @zh 触发 `scrollToBounces` 事件时，下部回弹的阈值距离（单位：px）
   * @defaultValue 0
   * @iOS
   * @Android
   * @Harmony
   */
  endBounceTriggerDistance?: number
  /**
   * Content of upper bounces view, which will be displayed during the upper bouncing effect.
   * @zh 上部回弹视图的内容，将在上部回弹效果期间显示。
   * @iOS
   * @Android
   * @Harmony
   */
  upperBounceItem?: ReactElement
  /**
   * Content of lower bounces view, which will be displayed during the lower bouncing effect.
   * @zh 下部回弹视图的内容，将在下部回弹效果期间显示。
   * @iOS
   * @Android
   * @Harmony
   */
  lowerBounceItem?: ReactElement
  /**
   * Whether the scrollable container can bounce when the content area of the scrollable container is smaller than the viewport area.
   * @zh 当可滚动容器的内容区域小于视口区域时，是否允许容器回弹。
   * @defaultValue true
   * @iOS
   * @Android
   * @Harmony
   */
  alwaysBouncing?: boolean
  /**
   * The direction of the bounce effect. 'both' for bouncing on both ends, 'none' to disable bounce, and 'upper'/'lower' for bouncing on either end
   * @zh 回弹效果的方向。'both' 表示两端都回弹，'none' 表示禁用回弹，'upper'/'lower' 表示只在上端或下端回弹。
   * @defaultValue 'both'
   * @iOS
   * @Android
   * @Harmony
   */
  singleSidedBounce?: 'upper' | 'lower' | 'both' | 'iOSBounces' | 'none'
  /**
   * Unit: px. Optional size hint for bounce effect. Recommended when used in List or <list/>.
   * @zh 单位：px。可选的回弹效果尺寸提示。在列表或 `<list/>` 中使用时推荐设置。
   * @Android
   * @iOS
   * @Harmony
   */
  estimatedHeight?: number
  /**
   * Unit: px. Optional size hint for bounce effect. Recommended when used in List or <list/>.
   * @zh 单位：px。可选的回弹效果尺寸提示。在列表或 `<list/>` 中使用时推荐设置。
   * @Android
   * @iOS
   * @Harmony
   */
  estimatedWidth?: number
  /**
   * Display debug logs. Open it when you find a bug.
   * @zh 显示调试日志。当您发现错误时，请打开此选项。
   * @defaultValue false
   * @iOS
   * @Android
   * @Harmony
   */
  debugLog?: boolean
  /**
   * requestAnimationFrame don't work under lynx version 2.15.2. This switch should be opened when the version is higher than 2.15.2.
   * @zh `requestAnimationFrame` 在 lynx 2.15.2 以下版本中不起作用。当版本高于 2.15.2 时，应打开此开关。
   * @defaultValue false
   * @iOS
   * @Android
   * @Harmony
   */
  validAnimationVersion?: boolean
  /**
   * When bounces effect is triggered and the bounce distance is larger than startBounceDistance or endBounceDistance on the upper or lower side, the scrollToBounces event will be triggered.
   * @zh 当触发回弹效果并且回弹距离在上侧或下侧大于 `startBounceDistance` 或 `endBounceDistance` 时，将触发 `scrollToBounces` 事件。
   * @defaultValue 0
   * @eventProperty
   * @iOS
   * @Android
   * @Harmony
   */
  onScrollToBounces?: (e: scrollToBouncesInfo) => void
}
