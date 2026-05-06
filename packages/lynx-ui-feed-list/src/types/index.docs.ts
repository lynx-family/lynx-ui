// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ForwardedRef, ReactElement } from '@lynx-js/react'

import type { BaseGesture } from '@lynx-js/gesture-runtime'
import type { ListProps, ListRef } from '@lynx-js/lynx-ui-list'

import type { BounceableBasicProps, RefreshProps } from '../hooks/useRefresh'

export type FeedList = (props: FeedListProps) => ReactElement

export interface FeedListRef extends ListRef {
  /**
   * After the startrefresh event, calling this method will end the refresh state and make the refreshHeader bounces hack.
   * @Android
   * @iOS
   * @zh 在startRefresh事件之后，调用此方法将结束刷新状态并使刷新Header进行反弹。
   */
  finishRefresh: () => void
  /**
   * When enable-refresh is true, calling this function causes the refreshHeader to be fully exposed, triggering the startrefresh event. Afterwards, refreshHeader is attached to the top of List.
   * @Android
   * @iOS
   * @zh 当enable-refresh为true时，调用此函数会使刷新Header全露并触发startRefresh事件。之后，刷新Header附加到List的顶部。
   */
  startRefresh: () => void
  /**
   * When no more data has to be inserted, call this method to replace loadMoreFooter to noMoreDataFooter.
   * @Android
   * @iOS
   * @zh 当没有更多数据要插入时，调用此方法将loadMoreFooter替换为noMoreDataFooter。
   */
  changeHasMoreStatus: (hasMore: boolean) => void
}

export interface FeedListProps extends Omit<ListProps, 'ref'> {
  ref?: ForwardedRef<FeedListRef>
  /**
   * Accept true for default options. If you need to customize the refresh effect, you can pass in the RefreshProps.
   * @defaultValue false
   * @Android
   * @iOS
   * @zh 接受true为默认选项。如果需要自定义刷新效果，可以传入RefreshProps。
   */
  refreshOptions?: boolean | RefreshProps
  /**
   * Accept true for default options. If you need to customize the bounceable effect, you can pass in the bounceableProps.
   * @defaultValue false
   * @Android
   * @iOS
   * @zh 接受true为默认选项。如果需要自定义弹性效果，可以传入bounceableProps。
   */
  bounceableOptions?: boolean | BounceableBasicProps
  /**
   * Enable debug logs for refresh and bounce lifecycle.
   * @zh 是否开启 refresh / bounce 生命周期关键日志。
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   */
  debugLog?: boolean
  /**
   * Whether horizontal bounce direction should be mirrored in RTL mode.
   * @zh 是否在 RTL 模式下镜像水平回弹方向。
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   */
  enableRTL?: boolean
  /**
   * The loadmore area of the list.
   * @defaultValue false
   * @Android
   * @iOS
   * @zh 列表的加载更多区域。
   */
  loadMoreFooter?: ReactElement
  /**
   * When no more data to be inserted and the hasMoreData method is called, the loadMoreFooter will be switched to noMoreDataFooter.
   * @defaultValue false
   * @Android
   * @iOS
   * @zh 当没有更多数据要插入并且调用hasMoreData方法时，loadMoreFooter将被切换为noMoreDataFooter。
   */
  noMoreDataFooter?: ReactElement
  /**
   * If you want to use gesture, pass it here.
   * @iOS
   * @Android
   * @zh 如果您想使用手势，请在此处传递。
   */
  'main-thread:gesture'?: BaseGesture
}

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
