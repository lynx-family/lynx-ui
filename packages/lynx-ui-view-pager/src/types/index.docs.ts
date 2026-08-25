// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ForwardedRef, ReactElement } from '@lynx-js/react'

import type { ComponentBasicProps, LazyOptions } from '@lynx-js/lynx-ui-common'
import type {
  CSSProperties,
  ViewPagerProps as NativeViewPagerProps,
} from '@lynx-js/types'

export type ViewPager = (props: ViewPagerProps) => ReactElement

export interface ViewPagerRef {
  /**
   * Slide to the specified page.
   * @zh 滑动到指定页面。
   * @Android
   * @iOS
   */
  selectTab: (
    /**
     * The index to be scrolled to.
     * @zh 要滚动到的索引。
     * @Android
     * @iOS
     */
    index: number,
    /**
     * If a animation effect needed.
     * @zh 是否需要动画效果。
     * @Android
     * @iOS
     */
    smooth: boolean,
    success?: (res: unknown) => void,
    fail?: (res: unknown) => void,
  ) => void
}

export interface ViewPagerProps extends ComponentBasicProps {
  ref?: ForwardedRef<ViewPagerRef>
  /**
   * Enable lazy rendering for off-screen pages.
   * @zh 启用屏外页面的懒加载渲染。
   * @defaultValue `{ enableLazy: true, scene: 'viewpager', exposureLeft: '50px', exposureRight: '50px' }`
   * @Android
   * @iOS
   */
  lazyOptions?: LazyOptions
  /**
   * Be used to mark the exposure timing of lazy loading. Please ensure that it is unique throughout the page.
   * @zh 用于标记懒加载的曝光时间。请确保在整个页面中唯一。
   * @Android
   * @iOS
   * @deprecated Please use `lazyOptions` instead.
   */
  scene?: string
  /**
   * The id of the `viewpager`. It is used to select the element. When omitted, ViewPager generates a unique id for the instance.
   * @zh `viewpager` 的 ID，用于选择该元素。省略时，ViewPager 会为当前实例生成唯一 ID。
   * @Android
   * @iOS
   */
  viewpagerId?: string
  /**
   * Style for `viewpager`. Changing its layout with style is unrecommended.
   * @zh `viewpager` 的样式。不建议通过样式改变其布局。
   * @Android
   * @iOS
   */
  style?: CSSProperties
  /**
   * Style for `viewpager-item`.
   * @zh `viewpager-item` 的样式。
   * @Android
   * @iOS
   */
  viewpagerItemStyle?: CSSProperties
  /**
   * Specify the index after datasource changed. Please use `selectTab` for other updates.
   * @zh 数据源改变后指定的索引。请使用 `selectTab` 进行其他更新。
   * @defaultValue 0
   * @Android
   * @iOS
   * @deprecated Please use `initialSelectIndex` instead
   */
  selectIndexAfterDataSourceChanged?: number
  /**
   * Specify the index of the initial display. Please use `selectTab` for other updates.
   * @zh 指定初始显示的索引。请使用 `selectTab` 进行其他更新。
   * @defaultValue 0
   * @Android
   * @iOS
   * @Harmony
   * @since 2.17
   */
  initialSelectIndex?: number
  /**
   * Enable iOS bounces spring effect
   * @zh 启用 iOS 弹性效果
   * @defaultValue true
   * @iOS
   */
  bounces?: boolean
  /**
   * Additional props that will be passed through to the underlying `viewpager` element.
   * @zh 将被直接传递到底层 `viewpager` 元素的额外属性。
   * @iOS
   * @Android
   */
  viewpagerProps?: Partial<NativeViewPagerProps>
  /**
   * exposure-screen-margin-left
   * @zh 曝光屏幕左边距
   * @defaultValue '50px'
   * @Android
   * @iOS
   * @Harmony
   * @deprecated Please use 'lazyOptions' instead.
   */
  exposureLeft?: string
  /**
   * exposure-screen-margin-right
   * @zh 曝光屏幕右边距
   * @defaultValue '50px'
   * @Android
   * @iOS
   * @Harmony
   * @deprecated Please use 'lazyOptions' instead.
   */
  exposureRight?: string
  /**
   * ViewPager scrolled.
   * @zh ViewPager 滚动。
   * @eventProperty
   * @Android
   * @iOS
   */
  onOffsetChange?: (e: { detail: ViewPagerOffsetChangeEvent }) => void
  /**
   * ViewPager scrolled. The handler should be a main thread event.
   * @zh ViewPager 滚动。该事件处理函数应在主线程中执行。
   * @eventProperty
   * @Android
   * @iOS
   */
  MTOnOffsetChange?: (e: { detail: ViewPagerOffsetChangeEvent }) => void
  /**
   * Viewpager page will be changed.
   * @zh Viewpager 页面将要改变。
   * @eventProperty
   * @Android
   * @iOS
   * @Harmony
   * @since 2.17
   */
  onPageWillChange?: (e: { detail: ViewPagerChangeEvent }) => void
  /**
   * Viewpager page will be changed. The handler should be a main thread event.
   * @zh Viewpager 页面将要改变。该事件处理函数应在主线程中执行。
   * @eventProperty
   * @Android
   * @iOS
   */
  MTOnPageWillChange?: (e: { detail: ViewPagerChangeEvent }) => void
  /**
   * Viewpager page did changed.
   * @zh Viewpager 页面已改变。
   * @eventProperty
   * @Android
   * @iOS
   */
  onPageChange?: (e: { detail: ViewPagerChangeEvent }) => void
  /**
   * Viewpager page did changed. The handler should be a main thread event.
   * @zh Viewpager 页面已改变。该事件处理函数应在主线程中执行。
   * @eventProperty
   * @Android
   * @iOS
   */
  MTOnPageChange?: (e: { detail: ViewPagerChangeEvent }) => void
  /**
   * Enable horizontal scroll.
   * @zh 启用水平滚动。
   * @defaultValue true
   * @Android
   * @iOS
   */
  enableScroll?: boolean
  /**
   * Children, which is ViewPagerItems.
   * @zh 子元素, 即 ViewPagerItems。
   * @Android
   * @iOS
   */
  children?: ReactElement[]
}

export interface ViewPagerChangeEvent {
  /**
   * Current index
   * @zh 当前索引
   * @Android
   * @iOS
   */
  index: number
  /**
   * If being dragged
   * @zh 是否被拖动
   * @Android
   * @iOS
   */
  isDragged: boolean
}

export interface ViewPagerOffsetChangeEvent {
  /**
   * The scrolling offset, in px
   * @zh 滚动偏移量，以像素为单位
   * @Android
   * @iOS
   */
  offset: number
}
