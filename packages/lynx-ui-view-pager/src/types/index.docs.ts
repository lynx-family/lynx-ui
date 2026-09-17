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

export type ViewPagerExposureMargin = `${number}px` | `${number}rpx`

export type ViewPagerLazyOptions =
  | {
    /** Disable lazy rendering. @zh 禁用懒渲染。 */
    enableLazy: false
  }
  | {
    /** Enable exposure-driven lazy rendering for pages other than the initial page. @zh 为初始页面以外的页面启用基于曝光的懒渲染。 */
    enableLazy: true
    /** Exposure scene shared by this pager's lazy placeholders. It must be unique on the page. @zh 此分页器的懒加载占位节点共用的曝光场景，在页面内必须唯一。 */
    scene: string
    /** Extend or shrink the placeholder's left exposure boundary. @defaultValue 10px @zh 扩展或缩小占位节点的左侧曝光边界。 */
    exposureLeft?: ViewPagerExposureMargin
    /** Extend or shrink the placeholder's right exposure boundary. @defaultValue 10px @zh 扩展或缩小占位节点的右侧曝光边界。 */
    exposureRight?: ViewPagerExposureMargin
  }

export interface ViewPagerItemOptions extends ComponentBasicProps {
  /**
   * Native attributes applied to the generated viewpager-item, including
   * accessibility properties.
   * @zh 应用于自动生成的 viewpager-item 的原生属性，包括无障碍属性。
   * @Android
   * @iOS
   */
  itemProps?: Omit<NativeViewPagerItemProps, 'children' | 'className' | 'style'>
}

export interface ViewPagerProps<T> extends ComponentBasicProps {
  /**
   * Data rendered as pages. ViewPager creates one direct native
   * viewpager-item child for every entry.
   * @zh 页面数据。ViewPager 为每条数据创建一个直接的原生 viewpager-item 子节点。
   * @Android
   * @iOS
   */
  data: readonly T[]
  /**
   * Return a stable, unique key for an entry. When omitted, the item index is
   * used. Provide this function when items can be inserted, removed, or reordered.
   * @zh 返回条目的稳定唯一键。不传时使用条目索引；当条目可能插入、删除或重排时请提供此函数。
   * @docTypeFallback (item: T, index: number) => string | number
   * @Android
   * @iOS
   */
  getItemKey?: (item: T, index: number) => string | number
  /**
   * Render page content. Selection state is intentionally not passed, so a
   * native swipe does not require React to rerender page content.
   * @zh 渲染页面内容。此函数有意不传入选中状态，因此原生滑动无需让 React 重新渲染页面内容。
   * @docTypeFallback (item: T, index: number) => ReactNode
   * @Android
   * @iOS
   */
  children: (item: T, index: number) => ReactNode
  /**
   * Initial page index. Later changes are ignored; use ref.selectTab to navigate.
   * @defaultValue 0
   * @zh 初始页面索引，后续修改不生效。使用 ref.selectTab 切换页面。
   * @Android
   * @iOS
   */
  initialSelectIndex?: number
  /**
   * Exposure-driven lazy rendering. The initial page renders immediately;
   * other pages render when their placeholders enter the configured exposure
   * area. Rendered pages stay mounted. Omit this prop to render every page.
   * @zh 基于曝光的懒渲染。初始页面立即渲染，其他页面在占位节点进入配置的曝光区域时渲染；已渲染页面保持挂载。不传时渲染全部页面。
   * @Android
   * @iOS
   */
  lazyOptions?: ViewPagerLazyOptions
  /**
   * Class name applied to every generated viewpager-item.
   * @zh 应用于每个自动生成的 viewpager-item 的类名。
   * @Android
   * @iOS
   */
  itemClassName?: string
  /**
   * Style applied to every generated viewpager-item.
   * @zh 应用于每个自动生成的 viewpager-item 的样式。
   * @Android
   * @iOS
   */
  itemStyle?: ComponentBasicProps['style']
  /**
   * Return class names, styles, or native attributes for one generated
   * viewpager-item. Per-item class names and styles are merged with shared values.
   * @zh 为单个自动生成的 viewpager-item 返回类名、样式或原生属性。每项的类名和样式会与共享值合并。
   * @docTypeFallback (item: T, index: number) => ViewPagerItemOptions
   * @Android
   * @iOS
   */
  getItemProps?: (item: T, index: number) => ViewPagerItemOptions
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
   * Native pager attributes not managed by the component.
   * @zh 组件未管理的原生分页器属性。
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
   * Native page completion event. Read the selected index from event.detail.index.
   * @zh 原生页面切换完成事件，从 event.detail.index 读取选中索引。
   * @Android
   * @iOS
   */
  onPageChange?: (event: ViewPagerChangeEvent) => void
  /**
   * Native event before a page transition completes. Read its data from event.detail.
   * @zh 原生页面切换完成前事件，从 event.detail 读取数据。
   * @Android
   * @iOS
   */
  onPageWillChange?: (event: ViewPagerWillChangeEvent) => void
  /**
   * Native scroll progress event. Read its data from event.detail.
   * @zh 原生滚动进度事件，从 event.detail 读取数据。
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
   * Main-thread scroll progress handler. Use a main thread function.
   * @zh 主线程滚动进度回调，需使用主线程函数。
   * @Android
   * @iOS
   */
  MTOnOffsetChange?: (event: ViewPagerOffsetChangeEvent) => void
}
