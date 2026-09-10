// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import type { ComponentBasicProps } from '@lynx-js/lynx-ui-common'
import type {
  ViewPagerItemProps as NativeViewPagerItemProps,
  ViewPagerProps as NativeViewPagerProps,
  ViewPagerChangeEvent,
  ViewPagerOffsetChangeEvent,
  ViewPagerWillChangeEvent,
} from '@lynx-js/types'

export type { ViewPagerChangeEvent, ViewPagerOffsetChangeEvent }

export interface ViewPagerRef {
  /**
   * Slide to a page through the native node ref. Animation defaults to true.
   * Indexes are clamped to available pages. Empty pagers ignore requests.
   * Completion is reported through onPageChange; success confirms invocation.
   * @zh 通过原生节点引用切换页面，默认使用动画。索引限制在有效范围内，空列表忽略请求。onPageChange 表示切换完成，success 表示调用成功。
   * @Android
   * @iOS
   */
  selectTab: (
    index: number,
    smooth?: boolean,
    success?: (result: unknown) => void,
    fail?: (result: unknown) => void,
  ) => void
}

export interface ViewPagerProps extends ComponentBasicProps {
  /**
   * Initial page index. Later changes are ignored; use ref.selectTab to navigate.
   * @defaultValue 0
   * @zh 初始页面索引，后续修改不生效。使用 ref.selectTab 切换页面。
   * @Android
   * @iOS
   */
  initialSelectIndex?: number
  /**
   * Defer off-screen content until selected, preloaded, or about to appear.
   * Mounted content stays mounted until its keyed item is removed.
   * @defaultValue true
   * @zh 延迟挂载屏外内容；选中、预加载或即将显示时挂载。已挂载内容保留到对应条目被移除。
   * @Android
   * @iOS
   */
  lazy?: boolean
  /**
   * Number of neighboring pages to mount on each side of the selected page.
   * Nonnegative integer; ignored when lazy is false.
   * @defaultValue 1
   * @zh 选中页面两侧预加载的页面数，为非负整数。lazy 为 false 时忽略。
   * @Android
   * @iOS
   */
  preloadCount?: number
  /**
   * Enable horizontal swipe gestures.
   * @defaultValue true
   * @zh 启用水平滑动手势。
   * @Android
   * @iOS
   */
  enableScroll?: boolean
  /**
   * Enable the native spring effect where supported.
   * @defaultValue true
   * @zh 在支持的平台启用原生回弹效果。
   * @Android
   * @iOS
   */
  bounces?: boolean
  /**
   * Native pager attributes not managed by the component, including id and
   * accessibility attributes. Use the dedicated props for styles and events.
   * @zh 组件未管理的原生属性，包括 id 和无障碍属性。样式和事件使用专用属性。
   * @Android
   * @iOS
   */
  viewpagerProps?: Omit<
    NativeViewPagerProps,
    | 'children'
    | 'ref'
    | 'className'
    | 'style'
    | 'initial-select-index'
    | 'select-index'
    | 'align-width'
    | 'enable-scroll'
    | 'allow-horizontal-gesture'
    | 'bounces'
    | 'keep-item-view'
    | 'bindchange'
    | 'bindwillchange'
    | 'bindoffsetchange'
    | 'main-thread:bindchange'
    | 'main-thread:bindwillchange'
    | 'main-thread:bindoffsetchange'
  >
  /**
   * Native page completion event, including programmatic transitions.
   * @zh 原生页面切换完成事件，包括命令式切换。
   * @Android
   * @iOS
   */
  onPageChange?: (event: ViewPagerChangeEvent) => void
  /**
   * Native event before a page transition completes.
   * @zh 原生页面切换完成前事件。
   * @Android
   * @iOS
   */
  onPageWillChange?: (event: ViewPagerWillChangeEvent) => void
  /**
   * Native scroll progress in page units: 0 to 1 between the first two pages,
   * not a pixel distance.
   * @zh 原生滚动进度，以页面为单位。前两页之间为 0 到 1，并非像素距离。
   * @Android
   * @iOS
   */
  onOffsetChange?: (event: ViewPagerOffsetChangeEvent) => void
  /**
   * Main-thread page completion handler. Use a main thread function.
   * @zh 主线程页面切换完成回调，需使用主线程函数。
   * @Android
   * @iOS
   */
  MTOnPageChange?: (event: ViewPagerChangeEvent) => void
  /**
   * Main-thread page transition handler. Use a main thread function.
   * @zh 主线程页面即将切换回调，需使用主线程函数。
   * @Android
   * @iOS
   */
  MTOnPageWillChange?: (event: ViewPagerWillChangeEvent) => void
  /**
   * Main-thread scroll progress handler, in page units. Use a main thread function.
   * @zh 主线程滚动进度回调，以页面为单位，需使用主线程函数。
   * @Android
   * @iOS
   */
  MTOnOffsetChange?: (event: ViewPagerOffsetChangeEvent) => void
  /**
   * Direct ViewPagerItem elements. Arrays and conditional items are supported;
   * fragments and wrapper components are not. Use stable keys for dynamic pages.
   * Selection follows the numeric position after reordering; removed selections
   * clamp to the last page. An empty pager has index 0 and sends no requests.
   * @zh 直接使用 ViewPagerItem，支持数组和条件条目，不支持 Fragment 或包装组件。动态页面使用稳定 key。重排后按索引选择，删除后限制到最后一页，空列表索引为 0 且不发出请求。
   * @Android
   * @iOS
   */
  children?: ReactNode
}

export interface ViewPagerItemRenderProps {
  /**
   * Zero-based position in the pager.
   * @zh 页面从零开始的索引。
   * @Android
   * @iOS
   */
  index: number
  /**
   * Whether this is the selected page.
   * @zh 是否为选中页面。
   * @Android
   * @iOS
   */
  selected: boolean
}

export interface ViewPagerItemProps extends ComponentBasicProps {
  /**
   * Native item attributes, including accessibility properties.
   * @zh 原生页面容器属性，包括无障碍属性。
   * @Android
   * @iOS
   */
  itemProps?: Omit<NativeViewPagerItemProps, 'children' | 'className' | 'style'>
  /**
   * Page content or a function receiving selection state.
   * @zh 页面内容或接收选择状态的渲染函数。
   * @docTypeFallback ReactNode | ((status: ViewPagerItemRenderProps) => ReactNode)
   * @Android
   * @iOS
   */
  children?: ReactNode | ((status: ViewPagerItemRenderProps) => ReactNode)
}

export interface ViewPagerItemUIVariants {
  /**
   * Applied to the selected page container.
   * @zh 应用于选中页面容器。
   * @Android
   * @iOS
   */
  'ui-selected'?: boolean
}
