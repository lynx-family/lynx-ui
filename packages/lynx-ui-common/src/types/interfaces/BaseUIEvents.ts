// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  CommonEvent,
  LynxBindCatchEvent,
  LynxEvent,
  Target,
} from '@lynx-js/types'

export interface BaseUITouchEvents {
  /**
   * Send when a touch event is interrupted or cancelled before it is completed.
   * @zh 当触摸事件在完成前被中断或取消时发送。
   * @iOS
   * @Android
   * @Harmony
   * @eventProperty
   */
  onTouchCancel?: (e: LynxEvent<Target>['TouchCancel']) => void
  /**
   * Send when a touch-point is placed on the UI.
   * @zh 当触摸点放置在 UI 上时发送。
   * @iOS
   * @Android
   * @Harmony
   * @eventProperty
   */
  onTouchStart?: (e: LynxEvent<Target>['TouchStart']) => void
  /**
   * Send when a touch-point is removed from the UI.
   * @zh 当触摸点从 UI 上移除时发送。
   * @iOS
   * @Android
   * @Harmony
   * @eventProperty
   */
  onTouchEnd?: (e: LynxEvent<Target>['TouchEnd']) => void
  /**
   * Send when a touch-point is moving on the UI.
   * @zh 当触摸点在 UI 上移动时发送。
   * @iOS
   * @Android
   * @Harmony
   * @eventProperty
   */
  onTouchMove?: (e: LynxEvent<Target>['TouchMove']) => void
  /**
   * Send when a touch-point is held on the UI for a period of time.
   * @zh 当触摸点在 UI 上按住一段时间后发送。
   * @iOS
   * @Android
   * @Harmony
   * @eventProperty
   */
  onLongPress?: (e: LynxEvent<Target>['LongPress']) => void
  /**
   * Send when a touch-point is tapped on the UI.
   * @zh 当触摸点在 UI 上轻触时发送。
   * @iOS
   * @Android
   * @Harmony
   * @eventProperty
   */
  onTap?: (e: LynxBindCatchEvent<Target>['Tap']) => void
  /**
   * Same as onTouchCancel, but stops the event from propagating to parent elements.
   * @zh 与 onTouchCancel 相同，但会阻止事件冒泡。
   * @iOS
   * @Android
   * @Harmony
   * @eventProperty
   */
  catchTouchCancel?: (e: LynxEvent<Target>['TouchCancel']) => void
  /**
   * Same as onTouchStart, but stops the event from propagating to parent elements.
   * @zh 与 onTouchStart 相同，但会阻止事件冒泡。
   * @iOS
   * @Android
   * @Harmony
   * @eventProperty
   */
  catchTouchStart?: (e: LynxEvent<Target>['TouchStart']) => void
  /**
   * Same as onTouchEnd, but stops the event from propagating to parent elements.
   * @zh 与 onTouchEnd 相同，但会阻止事件冒泡。
   * @iOS
   * @Android
   * @Harmony
   * @eventProperty
   */
  catchTouchEnd?: (e: LynxEvent<Target>['TouchEnd']) => void
  /**
   * Same as onTouchMove, but stops the event from propagating to parent elements.
   * @zh 与 onTouchMove 相同，但会阻止事件冒泡。
   * @iOS
   * @Android
   * @Harmony
   * @eventProperty
   */
  catchTouchMove?: (e: LynxEvent<Target>['TouchMove']) => void
  /**
   * Same as onLongPress, but stops the event from propagating to parent elements.
   * @zh 与 onLongPress 相同，但会阻止事件冒泡。
   * @iOS
   * @Android
   * @Harmony
   * @eventProperty
   */
  catchLongPress?: (e: LynxEvent<Target>['LongPress']) => void
}

export interface BaseUIExposureEvents {
  /**
   * Exposure event for UI
   * @zh UI 的曝光事件。
   * @iOS
   * @Android
   * @Harmony
   */
  onUIAppear?: (e: CommonEvent) => void
  /**
   * Disappear event for UI
   * @zh UI 的消失事件。
   * @iOS
   * @Android
   * @Harmony
   */
  onUIDisappear?: (e: CommonEvent) => void
}
export interface BaseUILayoutEvents {
  /**
   * Send when UI has changed viewport size.
   * @zh 当 UI 视口大小改变时发送。
   * @iOS
   * @Android
   * @Harmony
   * @eventProperty
   */
  onLayoutChange?: (e: LynxEvent<Target>['LayoutChange']) => void
}
