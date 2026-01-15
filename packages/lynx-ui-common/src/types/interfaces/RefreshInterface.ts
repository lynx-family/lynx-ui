// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactElement } from '@lynx-js/react'

export interface RefreshEvent {
  triggeredBy: 'startRefresh' | 'drag'
}
export interface refreshOffsetEvent {
  offset: number
  headerSize: number
  isDragging: boolean
}
export interface headerReleased {
  offset: number
  headerSize: number
}

export enum RefreshState {
  IDLE = 0, // Hide
  OVER_DRAG_RELEASE = 1, // Drag over refresh header size and release
  REFRESHING = 2, // During refresh
  DRAGGING = 3, // Dragging
}

export interface RefreshStateChange {
  /**
   * Status of refreshHeader
   * @zh 刷新头的状态
   * @Android
   * @iOS
   * @Harmony
   */
  state: RefreshState
}

export interface RefreshProps {
  /**
   * Enable refresh
   * @zh 启用刷新
   * @Android
   * @iOS
   * @Harmony
   */
  enableRefresh: boolean
  /**
   * header children
   * @zh 头部内容
   * @Android
   * @iOS
   * @Harmony
   */
  headerContent: ReactElement
  /**
   * Display debug logs. Open it when you find a bug.
   * @zh 显示调试日志。当您发现错误时请打开它。
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   */
  debugLog?: boolean
  /**
   * requestAnimationFrame don't work under lynx version 2.15.2. This switch should be opened when the version is higher than 2.15.2.
   * @zh requestAnimationFrame 在 lynx 2.15.2 以下版本中不起作用。当版本高于 2.15.2 时，应打开此开关。
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   */
  validAnimationVersion?: boolean
  /**
   * Send when refresh started.
   * @zh 刷新开始时发送。
   * @Android
   * @iOS
   * @Harmony
   */
  onStartRefresh?: (e: RefreshEvent) => void
  /**
   * Send when header shows and moves.
   * @zh 当头部显示和移动时发送。
   * @Android
   * @iOS
   * @Harmony
   */
  onRefreshOffsetChange?: (e: refreshOffsetEvent) => void
  /**
   * Send during refresh dragging and header is visible.
   * @zh 在刷新拖动期间并且头部可见时发送。
   * @Android
   * @iOS
   * @Harmony
   */
  onRefreshStateChange?: (e: RefreshStateChange) => void
  /**
   * Send when drag is end.
   * @zh 拖动结束时发送。
   * @Android
   * @iOS
   * @Harmony
   */
  onHeaderReleased?: (e: headerReleased) => void
}
