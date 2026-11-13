// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import type { CSSProperties, ViewProps } from '@lynx-js/types'

/**
 * Numeric strings "0" through "9" select spacing steps: 0, 4, 8, 12, 16,
 * 24, 32, 40, 48, and 64px. Numbers are literal pixels; other strings are
 * Lynx CSS lengths, such as "4vw" or "var(--app-space)".
 * @zh 字符串 "0" 到 "9" 选择间距档位；数字表示像素，其他字符串表示 Lynx CSS 长度。
 */
export type Space = number | string

/**
 * Shared sizing and spacing for recipe layout components.
 * Axis spacing overrides shorthand spacing; individual sides override axes.
 * Explicit style values override recipe props.
 * @zh 布局组件共用的尺寸与间距。轴向覆盖整体间距，单边覆盖轴向，style 优先级最高。
 */
export interface LayoutProps {
  /** Content. Text must be wrapped in a text element. @zh 子节点，文字必须使用 text 元素。 */
  children?: ReactNode
  /** Additional CSS classes. @zh 附加 CSS 类名。 */
  className?: string
  /** Explicit overrides applied after layout props. @zh 覆盖布局属性的样式。 */
  style?: CSSProperties
  /** Native view attributes and events. @zh 原生 view 属性与事件。 */
  viewProps?: Omit<ViewProps, 'children' | 'className' | 'style'>
  /** Padding on all sides. @zh 四周内边距。 */
  p?: Space
  /** Horizontal padding. @zh 水平内边距。 */
  px?: Space
  /** Vertical padding. @zh 垂直内边距。 */
  py?: Space
  /** Top padding. @zh 顶部内边距。 */
  pt?: Space
  /** Right padding. @zh 右侧内边距。 */
  pr?: Space
  /** Bottom padding. @zh 底部内边距。 */
  pb?: Space
  /** Left padding. @zh 左侧内边距。 */
  pl?: Space
  /** Margin on all sides. @zh 四周外边距。 */
  m?: Space
  /** Horizontal margin. @zh 水平外边距。 */
  mx?: Space
  /** Vertical margin. @zh 垂直外边距。 */
  my?: Space
  /** Top margin. @zh 顶部外边距。 */
  mt?: Space
  /** Right margin. @zh 右侧外边距。 */
  mr?: Space
  /** Bottom margin. @zh 底部外边距。 */
  mb?: Space
  /** Left margin. @zh 左侧外边距。 */
  ml?: Space
  /** Width in Lynx CSS units; numeric values are pixels. @zh 宽度，数字表示像素。 */
  width?: CSSProperties['width']
  /** Minimum width. @zh 最小宽度。 */
  minWidth?: CSSProperties['minWidth']
  /** Maximum width. @zh 最大宽度。 */
  maxWidth?: CSSProperties['maxWidth']
  /** Height in Lynx CSS units; numeric values are pixels. @zh 高度，数字表示像素。 */
  height?: CSSProperties['height']
  /** Minimum height. @zh 最小高度。 */
  minHeight?: CSSProperties['minHeight']
  /** Maximum height. @zh 最大高度。 */
  maxHeight?: CSSProperties['maxHeight']
  /** Flex grow factor when this node is a flex item. @zh 作为 flex 子项时的放大比例。 */
  flexGrow?: CSSProperties['flexGrow']
  /** Flex shrink factor when this node is a flex item. @zh 作为 flex 子项时的缩小比例。 */
  flexShrink?: CSSProperties['flexShrink']
  /** Flex basis when this node is a flex item. @zh 作为 flex 子项时的基础尺寸。 */
  flexBasis?: CSSProperties['flexBasis']
}

/** A plain view with shared layout props and no forced display mode. @zh 不强制 display 的基础容器。 */
export interface BoxProps extends LayoutProps {}

/** A flex container with explicit native-compatible defaults. @zh 使用明确原生默认值的 flex 容器。 */
export interface FlexProps extends LayoutProps {
  /** Main-axis direction. @defaultValue "row" @zh 主轴方向。 */
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  /** Cross-axis alignment. @defaultValue "stretch" @zh 交叉轴对齐。 */
  align?: 'start' | 'center' | 'end' | 'baseline' | 'stretch'
  /** Main-axis alignment. @defaultValue "start" @zh 主轴对齐。 */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  /** Wrapping behavior. @defaultValue "nowrap" @zh 换行行为。 */
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  /** Space between items on both axes. @zh 两个轴的子项间距。 */
  gap?: Space
  /** Horizontal gap, overriding gap. @zh 水平间距，覆盖 gap。 */
  gapX?: Space
  /** Vertical gap, overriding gap. @zh 垂直间距，覆盖 gap。 */
  gapY?: Space
}

/** Horizontal flex layout. @zh 水平 flex 布局。 */
export interface RowProps extends Omit<FlexProps, 'direction'> {}

/** Vertical flex layout. @zh 垂直 flex 布局。 */
export interface ColumnProps extends Omit<FlexProps, 'direction'> {}

/**
 * A native CSS grid. Positive integer counts produce equal tracks; strings
 * may also specify supported track lists such as "100px 1fr".
 * @zh 原生 CSS grid。正整数生成等宽轨道，字符串也可指定支持的轨道列表。
 */
export interface GridProps extends LayoutProps {
  /** Column count or track list. @defaultValue "1" @zh 列数或列轨道列表。 */
  columns?: number | string
  /** Row count or track list. Numeric counts use equal fractional tracks. @zh 行数或行轨道列表。 */
  rows?: number | string
  /** Auto placement direction. @defaultValue "row" @zh 自动排列方向。 */
  flow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense'
  /** Vertical item alignment. @defaultValue "stretch" @zh 子项垂直对齐。 */
  align?: FlexProps['align']
  /** Horizontal item alignment. @defaultValue "stretch" @zh 子项水平对齐。 */
  justify?: 'start' | 'center' | 'end' | 'stretch'
  /** Space between tracks. @zh 轨道间距。 */
  gap?: Space
  /** Horizontal track gap. @zh 水平轨道间距。 */
  gapX?: Space
  /** Vertical track gap. @zh 垂直轨道间距。 */
  gapY?: Space
}

/** A centered, full-width content region with a maximum width. @zh 居中且限制最大宽度的内容区域。 */
export interface ContainerProps extends LayoutProps {
  /** Maximum width preset: 448, 688, 880, or 1136px. @defaultValue "4" @zh 最大宽度档位。 */
  size?: '1' | '2' | '3' | '4'
}

/** A section with vertical breathing room. @zh 提供垂直留白的区块。 */
export interface SectionProps extends LayoutProps {
  /** Vertical padding preset: 16, 32, or 64px. @defaultValue "2" @zh 垂直内边距档位。 */
  size?: '1' | '2' | '3'
}
