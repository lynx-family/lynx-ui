// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode, RefObject } from '@lynx-js/react'

import type { ComponentBasicProps, Point } from '@lynx-js/lynx-ui-common'
import type { MainThread, ViewProps } from '@lynx-js/types'

export type basicDirections = 'left' | 'right' | 'up' | 'down'
export type directions = basicDirections | basicDirections[] | 'all' | 'none'

export interface useDragOptions {
  /**
   * Whether the component is draggable.
   * @defaultValue true
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh 组件是否可拖拽
   */
  enableDragging?: boolean
  /**
   * The direction of the drag.
   * @defaultValue 'all'
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh 允许的拖拽方向
   */
  allowedDirection?: directions
  /**
   * The minimum value of the X-axis translation.
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh X 轴方向 translate 的最小值
   */
  minTranslateX?: number
  /**
   * The maximum value of the X-axis translation.
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh X 轴方向 translate 的最大值
   */
  maxTranslateX?: number
  /**
   * The minimum value of the Y-axis translation.
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh Y 轴方向 translate 的最小值
   */
  minTranslateY?: number
  /**
   * The maximum value of the Y-axis translation.
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh Y 轴方向 translate 的最大值
   */
  maxTranslateY?: number
  /**
   * Reset the transform to 0 when the dragging process ends.
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh 当拖拽结束时复位 transform
   */
  resetOnEnd?: boolean
  /**
   * The way to trigger the drag.
   * @defaultValue 'longpress'
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh 触发拖拽的方式
   */
  trigger?: 'longpress' | 'immediate'
  /**
   * Triggers when the item starts to be dragged
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh 当拖拽开始时触发
   */
  onDragStart?: (pagePoint: Point) => void
  /**
   * Triggers when the item is dragging
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh 当拖拽进行时触发
   */
  onDragging?: (translate: Point) => void
  /**
   * Triggers when the drag is over
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh 当拖拽结束时触发
   */
  onDragEnd?: (translate: Point) => void
  /**
   * Triggered during the dragging process. It runs on the main thread, allowing for more timely UI operations. Please ensure that the passed handler is a main thread function, i.e., a function marked with 'main thread'.
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh 当拖拽进行时触发。在主线程运行，可以执行更及时的 UI 操作。请确保传入的 handler 是主线程函数，即带有 'main thread' 标记的函数。
   */
  onMTSDragStart?: (
    pagePoint: Point,
    event: MainThread.MouseEvent | MainThread.TouchEvent,
  ) => void
  /**
   * Triggered when the dragging ends. It runs on the main thread, allowing for more timely UI operations. Please ensure that the passed handler is a main thread function, i.e., a function marked with 'main thread'.
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh 当拖拽结束时触发。在主线程运行，可以执行更及时的 UI 操作。请确保传入的 handler 是主线程函数，即带有 'main thread' 标记的函数。
   */
  onMTSDragging?: (
    translate: Point,
    event: MainThread.MouseEvent | MainThread.TouchEvent,
  ) => void
  /**
   * Triggered when the dragging ends. It runs on the main thread, allowing for more timely UI operations. Please ensure that the passed handler is a main thread function, i.e., a function marked with 'main thread'.
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh 当拖拽结束时触发。在主线程运行，可以执行更及时的 UI 操作。请确保传入的 handler 是主线程函数，即带有 'main thread' 标记的函数。
   */
  onMTSDragEnd?: (
    translate: Point,
    event: MainThread.MouseEvent | MainThread.TouchEvent,
  ) => void
}

export interface DraggableProps extends ComponentBasicProps, useDragOptions {
  /**
   * Id
   * @zh id
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   */
  id?: string
  /**
   * children
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh 子节点
   */
  children?: ReactNode
  /**
   * Whether the component is draggable.
   * @defaultValue true
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh 组件是否可拖拽
   */
  enableDragging?: boolean
  /**
   * Extra props for draggable. It accepts all the props of the normal view.
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh 可拖拽组件的额外属性。接受普通 `view` 的所有属性。
   */
  draggableProps?: ViewProps
  /**
   * main-thread:ref
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh main-thread:ref
   */
  MTSRef?: RefObject<DraggableRef>
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

export interface DraggableAreaProps extends ComponentBasicProps {
  /**
   * Id
   * @zh id
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   */
  id?: string
  /**
   * children
   * @iOS
   * @Android
   * @Harmony
   * @Clay
   * @zh 子节点
   */
  children?: ReactNode
}

export interface DraggableRef {
  /**
   * Resets the internal state of the draggable component, such as the starting touch point and current translation. This is useful for programmatically resetting the component's state if you control the transform outside this component.
   * @zh 重置可拖动组件的内部状态，例如起始触摸点和当前平移量。如果你在组件外部控制 transform，此方法可用于外部重置组件状态。
   * @example
   * ```ts
   * 'main-thread'
   * draggableRef.current?.MTSResetInternalTranslateValues()
   * ```
   */
  MTSResetInternalTranslateValues: () => void
  /**
   * Programmatically sets the transform style of the draggable element. 'transform' should always be set this way from the outside or it will break the logic.
   * @param x The x-coordinate of the translation.
   * @param y The y-coordinate of the translation.
   * @zh 以编程方式设置可拖动元素的 transform 样式。从外部设置 'transform' 需通过此方法，否则会破坏内部逻辑。
   * @example
   * ```ts
   * 'main-thread'
   * draggableRef.current?.MTSSetTransform(100, 200)
   * ```
   */
  MTSSetTransform: (x: number, y: number) => void
  /**
   * Programmatically sets a map of CSS styles on the draggable element. This is useful for setting styles that are not directly related to the draggable behavior.
   * @param styles An object where keys are style property names and values are the style values.
   * @zh 在可拖动元素上设置一组 CSS 样式。可用于设置与可拖动行为不直接相关的样式。
   * @example
   * ```ts
   * 'main-thread'
   * draggableRef.current?.setOtherStyles({ 'background-color': 'red', 'z-index': '100' })
   * ```
   */
  MTSSetOtherStyles: (styles: Record<string, string>) => void
}
