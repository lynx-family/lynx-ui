// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ForwardedRef, ReactElement, ReactNode } from '@lynx-js/react'

import type { BaseGesture } from '@lynx-js/gesture-runtime'
import type {
  BaseScrollEvents,
  BaseUIExposureEvents,
  BaseUIExposureProps,
  BaseUILayoutEvents,
  BaseUITouchEvents,
  ComponentBasicProps,
} from '@lynx-js/lynx-ui-common'
import type { ListScrollStateChangeEvent, ListSnapEvent } from '@lynx-js/types'

export type List = (props: ListProps) => ReactElement

export interface ListItemInfo {
  width: number
  height: number
  itemKey: string
  isBinding: boolean
  originX: number
  originY: number
  updated: boolean
}

export interface diffResultDetails {
  insertions: number[]

  move_from: number[]

  move_to: number[]
  removals: number[]

  update_from: number[]

  update_to: number[]
}

export interface ListItemSnapAlignment {
  /**
   * Anchoring the position in pagination, with a value range of [0, 1].
   * 0 - the scrolling List child node aligns with the top of the List.
   * 1 - the scrolling List child node aligns with the bottom of the List.
   * @zh 分页定位锚定位置的参数，取值范围 [0, 1]
   * 0 - 子节点与 List 的顶部对齐
   * 1 - 子节点与 List 的底部对齐
   * @iOS
   * @Android
   * @Harmony
   */
  factor: number
  /**
   * Add an additional offset parameter to apply an extra offset on top of the factor.
   * @zh 额外增加偏移参数，在 factor 的基础之上再进一步添加偏移量
   * @iOS
   * @Android
   * @Harmony
   */
  offset: number
}

type ScrollPropagationBehavior =
  | 'native' // Follows platform default behavior
  | 'propagate' // Scroll events propagate to parent components when this component reaches its scroll boundary.
  // | 'propagateAtEdge' // @todo Child scrolls first; parent scrolls on next touch at edge
  | 'preventPropagate' // Never allow scroll propagation

export interface layoutCompleteEventDetail {
  /**
   * Connected to a setState.
   * @zh 与 setState 连接。
   * @iOS
   * @Android
   * @Harmony
   */
  'layout-id': number
  diffResult?: diffResultDetails
  visibleCellsAfterLayout?: ListItemInfo[]
  visibleCellsBeforeLayout?: ListItemInfo[]
}

export interface LayoutCompleteEvent {
  /**
   * Layout details.
   * @zh 布局详情
   * @iOS
   * @Android
   * @Harmony
   */
  detail: layoutCompleteEventDetail
}

export interface ListRef {
  /**
   * Scroll the list to the specified position and offset.
   * @zh 滚动列表到指定位置和偏移量。
   * @iOS
   * @Android
   * @Harmony
   */
  scrollTo: (
    /**
     * Scroll with animation
     * @zh 使用动画滚动
     * @iOS
     * @Android
     * @Harmony
     */
    animated: boolean,
    /**
     * The alignment of target item
     * @zh 目标项的对齐方式
     * @iOS
     * @Android
     * @Harmony
     */
    alignTo: 'top' | 'bottom' | 'middle' | 'none',
    /**
     * Scroll to index
     * @zh 滚动到的索引
     * @defaultValue 0
     * @iOS
     * @Android
     * @Harmony
     */
    index?: number,
    /**
     * Scroll to offset
     * @zh 滚动到的偏移量
     * @defaultValue 0
     * @iOS
     * @Android
     * @Harmony
     */
    offset?: number,
    success?: (res: unknown) => void,
    fail?: (res: unknown) => void,
  ) => void
  /**
   * Extends standard list's scrollTo. This method uses worklet and supports parameter id like 'scrollIntoView' method for scroll-view. As list is lazy, index is necessary in this method to find where id's component located. `useRefactorList={true}` is required
   * @zh 扩展标准列表的 scrollTo 方法。此方法使用 worklet 并支持像 scroll-view 方法的参数 id。由于列表是懒加载的，此方法中需要索引以找到 id 组件的位置。需要 `useRefactorList={true}`。
   * @iOS
   * @Android
   * @Harmony
   */
  scrollIntoID: (
    /**
     * Scroll with animation
     * @zh 使用动画滚动
     * @defaultValue false
     * @iOS
     * @Android
     * @Harmony
     */
    animated: boolean,
    /**
     * The alignment of target item
     * @zh 目标项的对齐方式
     * @defaultValue 'top'
     * @iOS
     * @Android
     * @Harmony
     */
    alignTo: 'top' | 'bottom' | 'middle' | 'none',
    listItemID: string,
    id: string,
    /**
     * Scroll to index
     * @zh 滚动到的索引
     * @iOS
     * @Android
     * @Harmony
     */
    index: number,
    /**
     * Scroll to offset
     * @zh 滚动到的偏移量
     * @iOS
     * @Android
     * @Harmony
     */
    offset?: number,
    success?: (res: unknown) => void,
    fail?: (res: unknown) => void,
  ) => void
  /**
   * Scroll the list to the specified position and offset.
   * @zh 自动滚动列表到指定位置和偏移量。
   * @iOS
   * @Android
   * @Harmony
   */
  autoScroll: (
    /**
     * The scrolling interval per second, supports positive and negative. iOS value must be greater than 1/screen.scale px.
     * @zh 每秒的滚动间隔，支持正值和负值。iOS 值必须大于 1/screen.scale 像素。
     * @iOS
     * @Android
     * @Harmony
     */
    rate:
      | `${number}px`
      | `${number}rpx`
      | `${number}ppx`
      | `${number}rem`
      | `${number}em`
      | `${number}vw`
      | `${number}vh`,
    /**
     * Start/stop automatic scrolling default->false
     * @zh 开始 / 停止自动滚动，默认 -> false
     * @iOS
     * @Android
     * @Harmony
     */
    start: boolean,
    /**
     * Whether to automatically stop when sliding to the bottom
     * @zh 是否在滑到底部时自动停止。
     * @iOS
     * @Android
     * @Harmony
     */
    autoStop: boolean,
  ) => void
  /**
   * Scroll the list to the specified position and offset.
   * @zh 将列表滚动到指定位置和偏移量。
   * @iOS
   * @Android
   * @Harmony
   */
  getVisibleCells: (
    success?: (res: unknown) => void,
    fail?: (res: unknown) => void,
  ) => void
}

export interface ListProps
  extends
    BaseUITouchEvents,
    BaseUIExposureEvents,
    BaseScrollEvents,
    BaseUILayoutEvents,
    BaseUIExposureProps,
    ComponentBasicProps
{
  ref?: ForwardedRef<ListRef>
  /**
   * The id of the list.
   * @zh 列表的 ID。
   * @iOS
   * @Android
   * @Harmony
   */
  listId: string
  /**
   * The name of list.
   * @zh 列表的名称。
   * @iOS
   * @Android
   * @Harmony
   */
  name?: string
  /**
   * The layout type of list.
   * @zh 列表的布局类型。
   * @iOS
   * @Android
   * @Harmony
   */
  listType: 'single' | 'flow' | 'waterfall'
  /**
   * Enable iOS bounces effect.
   * @zh 启用 iOS 弹性效果。
   * @defaultValue true
   * @iOS
   */
  bounces?: boolean
  /**
   * Children of list.
   * @zh 列表的子元素。
   * @iOS
   * @Android
   * @Harmony
   */
  children?: ReactNode
  /**
   * Enable vertical scroll.
   * @zh 启用垂直滚动。
   * @defaultValue true
   * @iOS
   * @Android
   * @Harmony
   */
  enableScroll?: boolean
  /**
   * Enable scrollBar.
   * @zh 启用滚动条。
   * @defaultValue false
   * @iOS
   * @Android
   * @Harmony
   */
  enableScrollBar?: boolean
  /**
   * Enable scroll monitor.
   * @zh 启用滚动监控。
   * @defaultValue false
   * @iOS
   * @Android
   * @Harmony
   */
  enableScrollMonitor?: boolean
  /**
   * The tag for scroll monitor.
   * @zh 滚动监控的标签。
   * @defaultValue false
   * @iOS
   * @Android
   * @Harmony
   */
  scrollMonitorTag?: string
  /**
   * Force touch event to send to List.
   * @zh 强制触摸事件发送到列表。
   * @defaultValue true
   * @iOS
   */
  iosEnableSimultaneousTouch?: boolean
  /**
   * Paginated scrolling effects
   * @zh 分页滚动
   * @iOS
   * @Android
   * @Harmony
   */
  itemSnap?: ListItemSnapAlignment
  /**
   * The lifecycle of element layer reuse. It solves the problem of reuse status disorder in the UI layer.
   * @zh 元素层复用的生命周期。解决 UI 层复用状态混乱的问题。
   * @defaultValue false
   * @iOS
   * @Android
   * @Harmony
   */
  shouldRequestStateRestore?: boolean
  /**
   * The span count of list.
   * @zh 列表的列数。
   * @defaultValue true
   * @iOS
   * @Android
   * @Harmony
   */
  spanCount: number
  /**
   * Unit is px. Sets the auto-limiting size for the container. When child content size is below this value,the container size adjusts to fit content. When exceeded, the container locks at this size.
   * @zh 单位是 px。设置容器的自适应高度限制。当子内容高度小于此值时，容器高度自动适应内容；当子内容超过此值时，容器高度将固定为该值并显示滚动条。
   * @iOS
   * @Android
   * @Harmony
   */
  listMaxSize?: number
  /**
   * Set to 'vertical' for vertical scrolling and set to 'horizontal' for horizontal scrolling.
   * @zh 设置为 'vertical' 为垂直滚动，设置为 'horizontal' 为水平滚动。
   * @defaultValue 'vertical'
   * @iOS
   * @Android
   * @Harmony
   */
  scrollOrientation: 'vertical' | 'horizontal'
  /**
   * Controls the number of nodes to be preloaded outside the on-screen nodes of the list. Not supported when listType is set to 'waterfall'.
   * @zh 控制列表在屏上节点之外，提前加载节点的个数。在 listType 为 waterfall 时不生效。
   * @defaultValue 0
   * @iOS
   * @Android
   * @Harmony
   */
  preloadBufferCount?: number
  /**
   * Specifies the major axis spacing between Component in the list.
   * @zh 指定列表中组件的主要轴间距。
   * @defaultValue 0
   * @iOS
   * @Android
   * @Harmony
   */
  mainAxisGap?: number
  /**
   * Specifies the cross axis spacing between Component in the list.
   * @zh 指定列表中组件的交叉轴间距。
   * @defaultValue 0
   * @iOS
   * @Android
   * @Harmony
   */
  crossAxisGap?: number
  /**
   * The offset of the sticky position from the top or bottom of the list.
   * @zh 粘性位置与列表顶部或底部的偏移量。
   * @defaultValue 0
   * @iOS
   * @Android
   * @Harmony
   */
  stickyOffset?: number
  /**
   * The position to which the list automatically scrolls on the initial load.
   * @zh 列表在初始加载时自动滚动到的位置。
   * @defaultValue 0
   * @iOS
   * @Android
   * @Harmony
   */
  initialScrollIndex?: number
  /**
   * Controls whether the attachedCells information is included in the bindScroll event detail.
   * @zh 控制是否在绑定滚动事件中包含附加单元格信息。
   * @defaultValue false
   * @iOS
   * @Android
   * @Harmony
   */
  showVisibleItemInfoInScrollEvent?: boolean
  /**
   * Will override the upper-threshold. The item threshold from the upper edge of the list to trigger the onScrollToUpper event.
   * @zh 上边缘触发 onScrollToUpper 事件的条目阈值。
   * @defaultValue 0
   * @iOS
   * @Android
   * @Harmony
   */
  upperThresholdItemCount?: number
  /**
   * Will override the lower-threshold. The item threshold from the lower edge of the list to trigger the onScrollToLower event.
   * @zh 下边缘触发 onScrollToLower 事件的条目阈值。
   * @defaultValue 0
   * @iOS
   * @Android
   * @Harmony
   */
  lowerThresholdItemCount?: number
  /**
   * The time interval, in milliseconds, for the list to trigger the scroll event callback.
   * @zh 列表触发滚动事件回调的时间间隔（毫秒）。
   * @defaultValue 200
   * @iOS
   * @Android
   * @Harmony
   */
  scrollEventThrottle?: number
  /**
   * Use refactored list.
   * @zh 使用重构后的列表。
   * @defaultValue true
   * @iOS
   * @Android
   * @Harmony
   */
  useRefactorList?: boolean
  /**
   * Output layout complete detailed info.
   * @zh 输出布局完成的详细信息。
   * @defaultValue false
   * @iOS
   * @Android
   * @Harmony
   */
  needLayoutCompleteInfo?: boolean
  /**
   * Controls whether scroll events propagate to parent containers. For now, 'preventPropagate' needs to be used together with temporaryBlockScrollClass and temporaryBlockScrollTag on iOS.
   * @zh 控制滚动事件是否向父级容器传递。'preventPropagate' 在 iOS 上暂时需与 temporaryBlockScrollClass 和 temporaryBlockScrollTag 配合使用。
   * @experimental Currently, this property has its limits because the full ability has dependency on higher native SDK version. On iOS the 'propagate' only works when the both parent component and this component are set to 'propagate'. And useRefactorList={true} don't support 'propagate'. On Android, the 'preventPropagate' can only works when its parent element is x-swiper and x-viewpager-ng.
   * @defaultValue 'native'
   * @iOS
   * @Android
   */
  scrollPropagationBehavior?: ScrollPropagationBehavior
  /**
   * The specific class name of the container that is blocked when 'scrollPropagationBehavior' is set to be 'preventPropagate', must be informed by the container provider. For now, 'preventPropagate' needs to be used together with temporaryBlockScrollClass and temporaryBlockScrollTag on iOS.
   * This is a temporary props and will be deprecated on new Lynx SDK version.
   * @zh 当 scrollPropagationBehavior 设为 'preventPropagate' 时，被阻止滚动的容器的具体类名。'preventPropagate' 在 iOS 上暂时需与 temporaryBlockScrollClass 和 temporaryBlockScrollTag 配合使用。
   * 此为临时属性，将在新版 Lynx SDK 中废弃。
   * @defaultValue 'BDXLynxViewPager'
   * @iOS
   */
  temporaryBlockScrollClass?: string
  /**
   * Used to specify the native container tag that is blocked when 'scrollPropagationBehavior' is set to be 'preventPropagate', corresponding to the Tag attribute of UIView. Needs to be specified by the native container provider. For now,  'preventPropagate' needs to be used together with temporaryBlockScrollClass and temporaryBlockScrollTag on iOS.
   * This is a temporary props and will be deprecated on new Lynx SDK version.
   * @zh 用于指定当 scrollPropagationBehavior 设为 'preventPropagate' 时被阻止滚动的原生容器标签（对应 UIView 的 Tag 属性）。该值需由原生容器提供方指定，且 'preventPropagate' 在 iOS 上暂时需与 temporaryBlockScrollClass 和 temporaryBlockScrollTag 配合使用。
   * 此为临时属性，将在新版 Lynx SDK 中废弃。
   * @defaultValue 0
   * @iOS
   */
  temporaryBlockScrollTag?: number
  /**
   * Used to control whether platform list enable overflow property on Android platform.
   * @zh 是否开启 android 平台层 list overflow
   * @defaultValue true
   * @Android
   */
  temporaryAndroidEnableOverflow?: boolean
  /**
   * Display debug logs. 0: none, 1: error, 2: info, 3: verbose
   * @zh 显示调试日志。0：无，1：错误，2：信息，3：详细
   * @defaultValue 0
   * @eventProperty
   * @iOS
   * @Android
   * @Harmony
   */
  debugLogLevel?: 0 | 1 | 2 | 3
  /**
   * If you want to use gesture, pass it here.
   * @zh 如果想使用gesture api，请传入该属性。
   * @iOS
   * @Android
   */
  'main-thread:gesture'?: BaseGesture
  /**
   * The scroll state change.
   * @zh 滚动状态变更。
   * @iOS
   * @Android
   * @Harmony
   * @eventProperty
   */
  onScrollStateChange?: (e: ListScrollStateChangeEvent) => void
  /**
   * Send when list's items are updated and this update process has finished.
   * @zh 当列表的条目更新并且此更新过程已完成时发送。
   * @iOS
   * @Android
   * @Harmony
   * @eventProperty
   */
  onLayoutComplete?: (e: LayoutCompleteEvent) => void
  /**
   * Send when list snaps to an item.
   * @zh 当列表限位滚动到一个条目时发送。
   * @iOS
   * @Android
   * @Harmony
   * @eventProperty
   */
  onSnapToItem?: (e: ListSnapEvent) => void
  /**
   * exposure-scene for global exposure
   * @zh 全局曝光的曝光场景
   * @iOS
   * @Android
   * @Harmony
   */
  exposureScene?: string
  /**
   * exposure-id for global exposure
   * @zh 全局曝光的曝光ID
   * @iOS
   * @Android
   * @Harmony
   */
  exposureID?: string
}
