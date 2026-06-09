// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

/**
 * The data structure for each item in the Sortable component.
 * @zh Sortable 组件中每个项目的数据结构。
 */
export interface SortableData<T> {
  /**
   * A function that returns the unique key for sorting.
   * @Android
   * @iOS
   * @Harmony
   * @zh 返回子节点用于排序的唯一键的函数。
   */
  getSortingKey: () => string
  /**
   * The original data item.
   * @Android
   * @iOS
   * @Harmony
   * @zh 原始数据项。
   */
  dataItem: T
}

export interface SortableRootProps<T> {
  /**
   * Specifies which container element SortableRoot should render and own as the scrollable boundary.
   * - `'ScrollView'`: render an internal vertical `scroll-view`.
   * - Omit (default): render a plain `view` without scrolling capability.
   * @Android
   * @iOS
   * @Harmony
   * @zh 指定 SortableRoot 渲染并持有的滚动容器类型。
   * - `'ScrollView'`：渲染一个内部的纵向 `scroll-view`。
   * - 不传（默认）：渲染普通 `view`，不带滚动能力。
   */
  as?: 'ScrollView'
  /**
   * Class name applied to the owned `scroll-view` when `as` is `'ScrollView'`.
   * @Android
   * @iOS
   * @Harmony
   * @zh `as` 为 `'ScrollView'` 时应用到内部 `scroll-view` 的类名。
   */
  scrollableClassName?: string
  /**
   * Class name applied to the owned content boundary view when `as` is `'ScrollView'`.
   * @Android
   * @iOS
   * @Harmony
   * @zh `as` 为 `'ScrollView'` 时应用到内部内容边界 view 的类名。
   */
  scrollableContentClassName?: string
  /**
   * Whether the owned `scroll-view` can be scrolled by user gestures.
   * @defaultValue true
   * @Android
   * @iOS
   * @Harmony
   * @zh 内部 `scroll-view` 是否允许用户手势滚动。
   */
  scrollableEnableScroll?: boolean
  /**
   * Distance between the dragged item and the upper edge of the owned or configured scrollable boundary while auto-scrolling upward.
   * @defaultValue 0
   * @Android
   * @iOS
   * @Harmony
   * @zh 向上自动滚动时，拖拽项与可滚动边界上边缘之间保持的距离。
   */
  scrollableStickyUpperOffset?: number
  /**
   * Distance between the dragged item and the lower edge of the owned or configured scrollable boundary while auto-scrolling downward.
   * @defaultValue 0
   * @Android
   * @iOS
   * @Harmony
   * @zh 向下自动滚动时，拖拽项与可滚动边界下边缘之间保持的距离。
   */
  scrollableStickyLowerOffset?: number
  /**
   * Whether to enable sorting.
   * @defaultValue true
   * @Android
   * @iOS
   * @Harmony
   * @zh 是否启用排序。
   */
  enableSorting?: boolean
  /**
   * Children, which is a function that receives an item and returns a ReactNode.
   * @Android
   * @iOS
   * @Harmony
   * @zh 子节点，是一个接收 item 并返回 ReactNode 的函数。
   */
  children: (item: SortableData<T>) => ReactNode
  /**
   * The data for the sortable list.
   * @Android
   * @iOS
   * @Harmony
   * @zh 拖拽列表的数据。
   */
  data: SortableData<T>[]
  /**
   * The unique key of the item that acts as the boundary. If the item is dragged out of the boundary, the sorting will be canceled.
   * @Android
   * @iOS
   * @Harmony
   * @zh 作为边界限制的项的唯一键。如果项被拖出边界，排序将被取消。
   */
  boundaryId?: string
  /**
   * The unique id of a scrollable boundary container. When the dragged item reaches the edge of this container, Sortable will call `scrollBy` on it so the list can continue moving with the drag direction.
   * @Android
   * @iOS
   * @Harmony
   * @zh 可滚动边界容器的唯一 id。当拖拽项触达该容器边缘时，Sortable 会对其调用 `scrollBy`，使列表随拖拽方向继续滚动。
   */
  scrollableBoundaryId?: string
  /**
   * Callback function that is triggered when sorting ends. The parameter is the sorted data.
   * @Android
   * @iOS
   * @Harmony
   * @zh 排序结束时触发的回调函数。参数为排序后的`data`。
   */
  onSortEnd: (sortedData: SortableData<T>[]) => void
  /**
   * Callback function that is triggered when sorting starts.
   * @Android
   * @iOS
   * @Harmony
   * @zh 拖拽排序开始时触发的回调函数。
   */
  onSortStart?: () => void
  /**
   * Display debug logs. Open it when you find a bug.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 显示调试日志，发现问题时开启。
   */
  debugLog?: boolean
}

/**
 * The item inside Sortable.
 * @zh Sortable 的子项。
 */
export interface SortableItemProps {
  /**
   * className
   * @zh 类名
   * @Android
   * @iOS
   * @Harmony
   */
  className?: string
  /**
   * The unique key for sorting.
   * @Android
   * @iOS
   * @Harmony
   * @zh 用于排序的唯一键。
   */
  sortingKey: string
  /**
   * Children.
   * @Android
   * @iOS
   * @Harmony
   * @zh 子节点。
   */
  children: ReactNode
  /**
   * Specifies the underlying component to be used.
   * @defaultValue 'Draggable'
   * @Android
   * @iOS
   * @Harmony
   * @zh 指定底层组件。若整个子节点区域均可拖动，使用默认值 'Draggable'；否则使用 'DraggableRoot'，'DraggableRoot' 需与子节点 'DraggableArea' 一起使用。仅触摸其子节点 'DraggableArea' 时可拖动。
   */
  as?: 'Draggable' | 'DraggableRoot'
}
