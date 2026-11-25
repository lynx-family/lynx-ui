// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { MainThreadRef, ReactNode } from '@lynx-js/react'

import type {
  GestureKind,
  NativeGesture,
  PanGestureConfig,
} from '@lynx-js/gesture-runtime'
import type { ComponentBasicProps } from '@lynx-js/lynx-ui-common'
import type { OverlayViewProps } from '@lynx-js/lynx-ui-overlay'
import type { ViewProps } from '@lynx-js/types'

export type SheetSide = 'top' | 'bottom' | 'left' | 'right' | 'start' | 'end'

/**
 * Optional local viewport inside SheetView. Wrap the backdrop and content
 * together for a localized backdrop, or place SheetBackdrop as a sibling inside
 * SheetView for a full-screen backdrop with a constrained sheet viewport (such as
 * asymmetric safe areas).
 * Width and height can be supplied synchronously in logical pixels or omitted to
 * auto-measure the positioner's own bounds on layout. Supply `insets` to place
 * edge offsets in CSS and seed initial fallback viewport bounds before layout
 * measurement completes.
 * CSS places the viewport; its origin does not enter snap or drag calculations.
 * Updating dimensions preserves the selected snap and active gestures.
 * @zh SheetView 内可选的局部视口。可同时包裹背景遮罩与内容实现局部遮罩，
 * 也可与 SheetBackdrop 在 SheetView 内并列放置，保留全屏遮罩并将面板视口约束在安全区域内。
 * 宽高可以逻辑像素同步传入，也可省略以在布局时自动测量定位容器尺寸。传入 `insets`
 * 可在 CSS 中设置边距，并在首次布局测量完成前预先扣除初始回退视口尺寸。
 * CSS 控制位置，原点不参与吸附或拖拽计算。更新宽高会保留吸附索引和正在进行的手势。
 */
export interface SheetPositionerProps extends ComponentBasicProps {
  /** Local viewport width in positive logical pixels. Overrides screenWidth; auto-measured when omitted. @zh 局部视口宽度，正逻辑像素，优先于 screenWidth；省略时自动测量。 */
  width?: number
  /** Local viewport height in positive logical pixels. Overrides screenHeight; auto-measured when omitted. @zh 局部视口高度，正逻辑像素，优先于 screenHeight；省略时自动测量。 */
  height?: number
  /**
   * Edge offsets inside `SheetView` in logical pixels. Applied as default CSS edge
   * offsets (`left`/`top`/`right`/`bottom`) and subtracted from fallback viewport
   * bounds before `SheetPositioner` completes its first layout measurement.
   * @zh 相对 `SheetView` 四边的偏移量（逻辑像素）。会作为默认 CSS 边距应用，并在首次布局测量完成前从回退视口尺寸中预先扣除。
   */
  insets?: SheetInsets
  /**
   * Called whenever resolved local viewport dimensions become available or change.
   * Fires for both explicit `width`/`height` props and auto-measured bounds.
   * @zh 当局部视口尺寸首次可用或发生变化时触发，同时覆盖显式传入宽高和自动测量场景。
   */
  onSizeChange?: (size: SheetViewportSize) => void
  children?: ReactNode
  /**
   * Native properties for the positioner view. Dimensions, clipping, className,
   * and style are owned by SheetPositioner; use style for its placement.
   * @zh 定位容器的原生属性。宽高、裁剪、类名和样式由 SheetPositioner 管理，使用 style 设置位置。
   */
  positionerProps?: ViewProps
}

export interface SheetRootRef {
  /**
   * @docTypeFallback (index: number, opts?: {animate?: boolean, snapAnimation?: SheetTransition}) => void
   */
  snapTo: (
    index: number,
    opts?: { animate?: boolean, snapAnimation?: SheetTransition },
  ) => void
  /**
   * @docTypeFallback (opts?: {animate?: boolean, snapAnimation?: SheetTransition}) => void
   */
  expand: (
    opts?: { animate?: boolean, snapAnimation?: SheetTransition },
  ) => void
  /**
   * @docTypeFallback (opts?: {animate?: boolean, snapAnimation?: SheetTransition}) => void
   */
  collapse: (
    opts?: { animate?: boolean, snapAnimation?: SheetTransition },
  ) => void
  /**
   * @docTypeFallback (opts?: {animate?: boolean, snapAnimation?: SheetTransition}) => void
   */
  close: (
    opts?: { animate?: boolean, snapAnimation?: SheetTransition },
  ) => void
  /**
   * @docTypeFallback (opts?: {animate?: boolean, snapAnimation?: SheetTransition}) => void
   */
  open: (
    opts?: { animate?: boolean, snapAnimation?: SheetTransition },
  ) => void
}

/**
 * The backdrop mask of the Sheet.
 * @zh Sheet 的背景遮罩。
 */
export interface SheetBackdropProps extends ComponentBasicProps {
  /**
   * children
   * @zh 子元素
   * @Android
   * @iOS
   * @Harmony
   */
  children?: ReactNode
  /**
   * Triggered when the backdrop is clicked.
   * @zh 点击背景时触发。
   * @Android
   * @iOS
   * @Harmony
   */
  onClick?: () => void
  /**
   * Whether to close the Sheet when the overlay is clicked.
   * @zh 点击遮罩时是否关闭 Sheet。
   * @defaultValue true
   * @Android
   * @iOS
   * @Harmony
   */
  clickToClose?: boolean
}

export interface SheetTransitionSpring {
  type: 'spring'
  stiffness?: number
  damping?: number
  mass?: number
}

export interface SheetTransitionTween {
  type: 'tween'
  duration?: number
  ease?: (t: number) => number
}

export type SheetTransition = SheetTransitionSpring | SheetTransitionTween

export interface SheetInsets {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

/**
 * Panel width, maximum width, or fit bound inside the local viewport, expressed
 * in logical pixels, a `'px'` string, or a percentage string of the local viewport.
 * @docTypeFallback number | `${number}%` | `${number}px`
 * @zh 局部视口内的面板宽度、最大宽度或 fit 尺寸约束，支持逻辑像素数值、`'px'` 字符串或相对局部视口尺寸的百分比字符串。
 */
export type SheetSurfaceSize = number | `${number}%` | `${number}px`

/**
 * Horizontal alignment of the sheet surface within the available corridor left
 * by `insets`. `'start'` and `'end'` respect `enableRTL`. Defaults to `'center'`.
 * @zh 面板在 `insets` 预留可用空间内的水平对齐方式；`'start'` 与 `'end'` 会跟随 `enableRTL`，默认为 `'center'`。
 */
export type SheetSurfaceAlign = 'start' | 'center' | 'end'

/**
 * Surface frame constraint box inside the local viewport.
 * `insets` define minimum edge margins, `width`/`maxWidth` are clamped to the
 * available horizontal corridor (`screenWidth - left - right`), and `align`
 * distributes remaining horizontal slack. When passed to `setFrame`, omitted or
 * `undefined` fields reset to their defaults.
 * @zh 局部视口内的面板约束框。`insets` 定义最小边距，`width`/`maxWidth` 会被钳制在可用水平宽度
 * （`screenWidth - left - right`）内，`align` 决定剩余水平空间的分配。调用 `setFrame` 时为全量替换，省略或 `undefined` 的字段恢复默认值。
 */
export interface SheetSurfaceFrame {
  insets?: SheetInsets
  width?: SheetSurfaceSize
  maxWidth?: SheetSurfaceSize
  align?: SheetSurfaceAlign
}

/**
 * Current local viewport dimensions (from `SheetPositioner` when mounted, or
 * fallback `screenWidth`/`screenHeight`) in logical pixels.
 * @zh 当前局部视口尺寸（挂载了 `SheetPositioner` 时为其尺寸，否则为 `screenWidth`/`screenHeight`），单位为逻辑像素。
 */
export interface SheetViewportSize {
  width: number
  height: number
}

/**
 * Presence lifecycle states emitted on the main thread while opening or closing the Sheet.
 * @zh Sheet 打开或关闭过程中在主线程派发的生命周期状态。
 */
export type SheetPresenceState = 'entering' | 'entered' | 'leaving' | 'left'

/**
 * Main-axis bounds for a bounded `'fit'` snap point inside `snapPoints`,
 * applied to the total `'fit'` panel size (including bottom safe-area reserve
 * and `SheetFooter` height). Values accept logical pixels, `'px'` strings, or
 * local-viewport percentages.
 * @zh 有界 `'fit'` 吸附点的主轴尺寸上下限（作用于包含底部安全区预留与 `SheetFooter` 的整体面板高度/宽度），支持逻辑像素数值、`'px'` 字符串或基于局部视口主轴尺寸的百分比字符串。
 */
export interface SheetFitBounds {
  /**
   * Minimum total panel size along the main axis in logical pixels, `'px'` string, or viewport percentage.
   * @zh 主轴方向的整体面板最小尺寸，支持逻辑像素数值、`'px'` 字符串或局部视口百分比字符串。
   */
  min?: SheetSurfaceSize
  /**
   * Maximum total panel size along the main axis in logical pixels, `'px'` string, or viewport percentage.
   * @zh 主轴方向的整体面板最大尺寸，支持逻辑像素数值、`'px'` 字符串或局部视口百分比字符串。
   */
  max?: SheetSurfaceSize
}

/**
 * Bounded `'fit'` snap point entry for `snapPoints`. Passing `{ fit: {} }` is
 * equivalent to `'fit'`.
 * @zh `snapPoints` 中带上下限约束的 `'fit'` 吸附点配置；传入 `{ fit: {} }` 等同于 `'fit'`。
 */
export interface SheetFitSnapPoint {
  /**
   * Minimum and maximum bounds for this `'fit'` snap point.
   * @zh 该 `'fit'` 吸附点的最小/最大尺寸约束。
   */
  fit: SheetFitBounds
}

/**
 * A snap point entry accepted by `SheetRoot.snapPoints`.
 * Accepts logical pixel numbers, `'%'` / `'px'` strings, `'fit'`, or `{ fit: { min?, max? } }`.
 * @docTypeFallback number | string | SheetFitSnapPoint
 * @zh `SheetRoot.snapPoints` 支持的吸附点项：像素数值、百分比/`px` 字符串、`'fit'` 或 `{ fit: { min?, max? } }`。
 */
export type SheetSnapPoint = number | string | SheetFitSnapPoint

export type SheetCornerRadius =
  | number
  | {
    topLeft?: number | null
    topRight?: number | null
    bottomRight?: number | null
    bottomLeft?: number | null
  }

/**
 * Main-thread controller for updating the Sheet surface's constraint frame and corner shape.
 * Drives surface bounds, clipping, and SheetBody safe-area clamping atomically on the main thread.
 * @zh 用于在主线程更新 Sheet 表面约束框与圆角形态的控制器，原子化同步表面边界、裁剪与 SheetBody 安全区避让。
 */
export interface SheetSurfaceController {
  /**
   * Replace the panel surface constraint frame inside the local viewport in logical pixels.
   * Any omitted or `undefined` field resets to its default (0 insets, full available width,
   * no max-width cap, `'center'` alignment). Pass `{ animating: true }` on intermediate animation
   * frames to defer committing bottom clip and viewport layout bounds until the final update
   * (when `animating` is omitted or `false`).
   * @zh 全量替换局部视口内的面板约束框（逻辑像素）。省略或为 `undefined` 的字段将恢复默认值
   * （零边距、占满可用宽度、无最大宽度限制、居中对齐）。动画中间帧可传入 `{ animating: true }`，
   * 将底部裁剪和视口布局边界推迟到最终更新（省略或传 `false`）时统一提交。
   */
  setFrame: (
    frame: SheetSurfaceFrame,
    options?: { animating?: boolean },
  ) => void
  /**
   * Update exposed corner radii in logical pixels. Passing a number sets all four corners;
   * passing an object merges only the specified corners while keeping omitted (`undefined`)
   * corners intact (pass `null` for an individual corner to restore its CSS radius). Passing
   * `undefined` restores CSS corners on all four corners.
   * @zh 更新可见圆角半径（逻辑像素）。传入数字会设置四个角；传入对象仅合并指定的角并保留省略（`undefined`）的角（对单个角传 `null` 可恢复其 CSS 圆角）；传入 `undefined` 将恢复四角的 CSS 圆角。
   */
  setCornerRadius: (radius: SheetCornerRadius | undefined) => void
  /**
   * Read the current local viewport dimensions (`{ width, height }`) on the main thread.
   * @zh 在主线程读取当前局部视口尺寸（`{ width, height }`）。
   */
  getViewportSize: () => SheetViewportSize
}

/**
 * The main content of the Sheet.
 * @zh Sheet 的主要内容。
 */
export interface SheetContentProps extends ComponentBasicProps {
  /**
   * A main-thread ref receiving the SheetSurfaceController while mounted.
   * Use `initialFrame` and `initialCornerRadius` for the opening appearance,
   * and drive live updates while open through this controller on the main thread
   * (for example in `main-thread:onSnapStart`, `main-thread:onDragStart`, or
   * `main-thread:onPositionChange`).
   * @Android
   * @iOS
   * @Harmony
   * @zh 挂载期间接收 SheetSurfaceController 的主线程引用。使用 `initialFrame` 和 `initialCornerRadius` 设置打开时的初始外观，打开期间的实时变更请在主线程通过该控制器驱动（例如在 `main-thread:onSnapStart`、`main-thread:onDragStart` 或 `main-thread:onPositionChange` 中）。
   */
  'main-thread:surfaceControllerRef'?: MainThreadRef<
    SheetSurfaceController | null
  >
  /**
   * Controlled panel surface constraint frame inside the local viewport. Applied on
   * mount, on each open, and reactively whenever its resolved values change while open
   * (takes precedence over `initialFrame`). Use `initialFrame` with
   * `main-thread:surfaceControllerRef` instead when driving per-frame animations.
   * @zh 受控的局部视口面板约束框。会在挂载、每次打开以及打开期间属性变化时响应更新（优先级高于 `initialFrame`）。如需在主线程逐帧驱动动画，请改用 `initialFrame` 配合 `main-thread:surfaceControllerRef`。
   */
  frame?: SheetSurfaceFrame
  /**
   * Controlled corner radii in logical pixels for the sheet's exposed corners.
   * Applied on mount, on each open, and reactively whenever its resolved values change
   * while open (takes precedence over `initialCornerRadius`). Use `initialCornerRadius`
   * with `main-thread:surfaceControllerRef` instead when driving per-frame animations.
   * @zh 受控的面板可见圆角半径（逻辑像素）。会在挂载、每次打开以及打开期间属性变化时响应更新（优先级高于 `initialCornerRadius`）。如需在主线程逐帧驱动动画，请改用 `initialCornerRadius` 配合 `main-thread:surfaceControllerRef`。
   */
  cornerRadius?: SheetCornerRadius
  /**
   * Opening panel surface constraint frame inside the local viewport (for
   * example, `{ insets: { bottom: 8 } }` for a floating card gap, or
   * `{ insets: { left: 16, right: 16, bottom: 8 }, maxWidth: 664 }` for a
   * centered floating card).
   * Applied on mount and on each open, including with `forceMount`; updates while
   * open take effect on the next open. Drive live changes while open through
   * `main-thread:surfaceControllerRef`.
   * @zh 打开时的面板在局部视口内的初始约束框（例如 `{ insets: { bottom: 8 } }` 或 `{ insets: { left: 16, right: 16, bottom: 8 }, maxWidth: 664 }`）。在挂载和每次打开时应用（包括 `forceMount`），打开期间的变更将在下次打开时生效；打开期间的实时变化请通过 `main-thread:surfaceControllerRef` 驱动。
   */
  initialFrame?: SheetSurfaceFrame
  /**
   * Opening corner radii in logical pixels for the sheet's exposed corners. A
   * number applies to every exposed corner; supply an object for asymmetric
   * corners. Applied on mount and on each open, including with `forceMount`;
   * updates while open take effect on the next open. Drive live changes while
   * open through `main-thread:surfaceControllerRef`. Zero explicitly makes a
   * corner square, and omitted corners fall back to CSS (or square on clipped
   * bottom corners).
   * @zh 打开时的面板可见圆角初始半径（逻辑像素）。传数字作用于四角，传对象按角分别设置。在挂载和每次打开时应用（包括 `forceMount`），打开期间的变更将在下次打开时生效；打开期间的实时变化请通过 `main-thread:surfaceControllerRef` 驱动。传 0 显式设为直角，省略的角沿用 CSS（被裁剪的底角默认为直角）。
   */
  initialCornerRadius?: SheetCornerRadius
  /**
   * The transition configuration for the Sheet snap animation.
   * @zh Sheet 动画的过渡配置。
   */
  snapAnimation?: SheetTransition
  /**
   * The enter animation configuration.
   * @zh Sheet 进入动画配置。
   */
  enterAnimation?: SheetTransition
  /**
   * The exit animation configuration.
   * @zh Sheet 退出动画配置。
   */
  exitAnimation?: SheetTransition
  /**
   * CSS class name for the inner layer.
   * Use this for content layout and sizing styles. In horizontal drawer mode,
   * the drawer width should be set here so `'fit'` can resolve from the
   * measured drawer width.
   * @zh 内层容器的 CSS 类名。
   * 用于设置内容区域的布局和尺寸样式。
   * 在水平抽屉模式下，应在这里设置抽屉宽度，这样 `'fit'` 才能根据测量得到的抽屉宽度完成解析。
   * @Android
   * @iOS
   * @Harmony
   */
  innerClassName?: string
  /**
   * Inline styles for the inner layer.
   * Use this for content layout and sizing styles. Visual styles can also be
   * applied here for a separately styled inner panel. The outer `style` prop
   * styles the painted surface; Sheet owns its coverage height and movement.
   * A narrower inner panel needs Lynx SDK 3.5 or newer for outside taps to
   * pass through the transparent moving surface to the backdrop.
   * In horizontal drawer mode, set drawer width here so `'fit'` can resolve
   * from the measured drawer width.
   * @zh 内层容器的内联样式。
   * 用于设置内容区域的布局和尺寸样式。
   * 内层面板与外层宽度不同时，也可以在此设置背景和圆角。主 `style` 属性作用于背景面板，Sheet 管理覆盖高度和位移。
   * 在水平抽屉模式下，应在这里设置抽屉宽度，这样 `'fit'` 才能根据测量得到的抽屉宽度完成解析。
   * @Android
   * @iOS
   * @Harmony
   */
  innerStyle?: ComponentBasicProps['style']
  /**
   * Native view properties for the inner panel. Sheet owns its ref, layout
   * measurement, gesture handlers, class name, and style; use `innerClassName`
   * and `innerStyle` for styling.
   * @zh 内层面板的原生 view 属性。Sheet 管理引用、布局测量、手势、类名和样式；
   * 请使用 `innerClassName` 和 `innerStyle` 设置样式。
   * @Android
   * @iOS
   * @Harmony
   */
  innerViewProps?: ViewProps
  /**
   * children
   * @zh 子元素
   * @Android
   * @iOS
   * @Harmony
   */
  children?: ReactNode
}

export type SheetGestureConfig = Pick<
  PanGestureConfig,
  'enabled' | 'minDistance'
>

/**
 * An optional action region pinned to the visible bottom sheet boundary.
 * Place one SheetFooter directly inside SheetContent or SheetNestedScrollContent,
 * outside any scrolling node. Supports side="bottom" only. Its intrinsic height
 * contributes to 'fit' snap points; numeric and percentage snaps stay unchanged.
 * Do not include the footer height again in the body's intrinsic 'fit' height.
 * Position, transform, and transition are managed by the Sheet.
 */
export interface SheetFooterProps extends ComponentBasicProps {
  /** Footer content. */
  children?: ReactNode
  /**
   * Reports the measured height on layout changes and zero on unmount, not animation frames.
   * Use it to reserve bottom padding in a custom scroll container. SheetFooter
   * does not modify scroll padding or automatically handle keyboard/safe-area insets.
   */
  onHeightChange?: (height: number) => void
}

export interface SheetGestureRelations {
  simultaneousWith?: GestureKind[]
  /**
   * Gestures that take priority over the Sheet pan. To isolate a same-axis
   * native scroll region, bind its own NativeGesture and enable native
   * consumption with manager.consumeGesture(true) in its onBegin callback.
   */
  waitFor?: GestureKind[]
  continueWith?: GestureKind[]
}

export interface SheetNestedScrollRenderProps {
  /**
   * The coordinated native gesture to bind to the outermost vertical scrolling
   * node. This is the same object returned by useSheetScrollGesture().
   */
  scrollGesture: NativeGesture
}

/**
 * A SheetContent replacement that coordinates sheet dragging and native scrolling;
 * all other parts are reused.
 * Requires enableNewGesture: true and LynxSDK 3.2 or newer.
 */
export interface SheetNestedScrollContentProps
  extends Omit<SheetContentProps, 'children'>
{
  /**
   * Regular content or a render function receiving the coordinated scroll
   * gesture. Deep descendants can access the same gesture with
   * useSheetScrollGesture().
   */
  children?: ReactNode | ((props: SheetNestedScrollRenderProps) => ReactNode)
  /** Native pan recognition thresholds. */
  gestureConfig?: SheetGestureConfig
  /** Relationships between the Sheet pan and external gestures. */
  gestureRelations?: SheetGestureRelations
}

/** A body region that can stay inside the local Sheet viewport as the panel moves. */
export interface SheetBodyProps extends ComponentBasicProps {
  children?: ReactNode
  /**
   * Minimum distance from each supplied physical edge of the local viewport,
   * in logical pixels. Place the body in the Sheet flex content layout, alongside
   * any handle that should travel with the panel. Supply at most one body per
   * SheetContent or SheetNestedScrollContent. Bottom sheets with a `fit` snap
   * measure the body at its available width. Bottom sheets keep the body's
   * layout stable during a drag and clip to the visible area. Use intrinsically
   * sized body content for `fit`. Other sheet sides support viewport insets
   * with explicit snaps.
   */
  viewportInsets?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
    start?: number
    end?: number
  }
}

/**
 * The root component of the Sheet, containing all of its child components.
 * @zh Sheet 的根组件，包含其所有子组件。
 */
export interface SheetRootProps extends ComponentBasicProps {
  /**
   * The side from which the sheet enters.
   * `bottom` preserves the existing bottom-sheet behavior.
   * `top` provides top-sheet behavior.
   * `left` and `right` provide physical drawer behavior.
   * `start` and `end` provide logical drawer behavior and resolve against `enableRTL`.
   * @defaultValue 'bottom'
   * @zh Sheet 进入的边。`bottom` 保持现有底部弹层行为，`top` 提供顶部弹层行为，`left` 和 `right` 提供物理抽屉方向，`start` 和 `end` 提供逻辑抽屉方向并根据 `enableRTL` 解析。
   */
  side?: SheetSide
  /**
   * Whether the Sheet should use RTL direction.
   * This sets the Sheet viewport direction to `rtl` by default and resolves
   * logical drawer sides in RTL mode.
   * When false, `start` means left and `end` means right.
   * When true, `start` means right and `end` means left.
   * Physical `left` and `right` sides are not affected by `enableRTL`.
   * @defaultValue false
   * @zh Sheet 是否使用 RTL 方向。默认会将 Sheet 视口方向设置为 `rtl`，并以 RTL 模式解析逻辑抽屉方向。为 false 时，`start` 为左侧、`end` 为右侧；为 true 时，`start` 为右侧、`end` 为左侧。物理 `left` 和 `right` 不受 `enableRTL` 影响。
   */
  enableRTL?: boolean
  /**
   * The snap points of the Sheet. Can be pixel numbers, percentages, `'fit'`,
   * or a bounded fit entry `{ fit: { min?, max? } }`.
   * - Numbers are treated as pixel values
   * - Percentages (e.g., '50%') are relative to screen height for `top` / `bottom`,
   *   and relative to screen width for `left` / `right` / `start` / `end`
   * - `'fit'` dynamically resolves to the measured content height for `top` / `bottom`,
   *   and the measured content width for `left` / `right` / `start` / `end`
   * - `{ fit: { min?, max? } }` resolves `'fit'` with main-axis bounds on the total
   *   panel size (including bottom safe-area reserve and `SheetFooter` height)
   * - Bottom `'fit'` is capped at the local viewport height above the bottom gap.
   *   Use scrollable content when the content exceeds that space.
   * @defaultValue ['fit']
   * The index order follows the order of this array.
   * @example snapPoints={['fit', '80%']} // First snap fits content, second is 80% of screen
   * @zh Sheet 的吸附点。可以是像素数值、百分比、`'fit'` 或 `{ fit: { min?, max? } }`。
   * - 数字被视为像素值
   * - 百分比（例如 '50%'）在 `top` / `bottom` 模式下相对于屏幕高度，在 `left` / `right` / `start` / `end` 模式下相对于屏幕宽度
   * - `'fit'` 在 `top` / `bottom` 模式下动态解析为测量的内容高度，在 `left` / `right` / `start` / `end` 模式下动态解析为测量的内容宽度
   * - `{ fit: { min?, max? } }` 为 `'fit'` 指定包含安全区预留与 `SheetFooter` 的整体面板主轴上下限
   * 索引顺序与该数组顺序一致。
   */
  snapPoints?: SheetSnapPoint[]
  /**
   * The initial snap point index.
   * @zh 初始吸附点索引。
   */
  initialSnap?: number
  /**
   * Called when the Sheet settles at a different snap index. During a drag,
   * the Sheet waits for the touch to end, including after a nested scroll handoff.
   * `value` is the resolved snap point in pixels.
   * @zh Sheet 到达不同的吸附档位时触发。拖拽时会等待触摸结束，即使手势已交给嵌套滚动容器。
   * `value` 表示换算后的像素值。
   */
  onSnapChange?: (index: number, value: number) => void
  /**
   * Called on the main thread after a snap target is selected and before the
   * Sheet starts moving to it. `value` is the resolved size in pixels, and
   * `animated` is false when the snap was requested without animation.
   *
   * This fires for drag releases and programmatic snaps, including snaps back
   * to the same point and release after handing off to a nested scroll at the
   * maximum point. It does not fire for opening or closing the Sheet.
   * Resizing an idle 'fit' panel to changed intrinsic content also requests an
   * immediate snap, with `animated` set to false.
   * Use the `main thread` directive in the callback.
   */
  'main-thread:onSnapStart'?: (
    index: number,
    value: number,
    animated: boolean,
  ) => void
  /**
   * Called on the main thread when the user begins dragging the Sheet,
   * including interrupting an active snap or close animation.
   * Use this to freeze or cancel coordinated consumer animations in place.
   * Use the `main thread` directive in the callback.
   * @zh 当用户开始拖拽 Sheet（包括打断正在进行的吸附或关闭动画）时在主线程触发，可用于原地冻结或取消协同动画。
   */
  'main-thread:onDragStart'?: () => void
  /**
   * Called on the main thread whenever the Sheet's main-axis position (visible
   * size in logical pixels) changes during drags or animations.
   * Use the `main thread` directive in the callback.
   * @zh Sheet 主轴位置（逻辑像素可见尺寸）在拖拽或动画过程中变化时在主线程触发。
   */
  'main-thread:onPositionChange'?: (position: number) => void
  /**
   * Called on the main thread when the Sheet transitions between presence states
   * (`'entering'`, `'entered'`, `'leaving'`, `'left'`), including drag resurrection
   * from `'leaving'` to `'entering'` (emitted before `main-thread:onDragStart`).
   * Use the `main thread` directive in the callback.
   * @zh Sheet 在主线程切换生命周期状态（`'entering'`、`'entered'`、`'leaving'`、`'left'`）时触发，
   * 包含从 `'leaving'` 拖拽恢复至 `'entering'`（在 `main-thread:onDragStart` 之前触发）。请在回调中使用 `main thread` 指令。
   */
  'main-thread:onPresenceChange'?: (state: SheetPresenceState) => void
  /**
   * The height of the Sheet container (screen height).
   * Used in vertical sheet mode (`top` / `bottom`) for percentage snap points
   * and dismissal calculations.
   * @zh Sheet 容器的高度（屏幕高度）。
   * 在垂直模式（`top` / `bottom`）下，用于计算百分比吸附点和关闭阈值。
   */
  screenHeight?: number
  /**
   * The width of the Sheet container (screen width).
   * Used in horizontal drawer mode (`left` / `right` / `start` / `end`) for percentage snap points
   * and dismissal calculations.
   * @zh Sheet 容器的宽度（屏幕宽度）。在水平抽屉模式（`left` / `right` / `start` / `end`）中用于百分比吸附点和关闭计算。
   */
  screenWidth?: number
  /**
   * The rubber band effect configuration.
   * By default, rubber band over-drag is enabled for vertical sheets
   * (`top` / `bottom`) and disabled for horizontal drawers
   * (`left` / `right` / `start` / `end`).
   * If true, enables default rubber band effect (coefficient 0.5).
   * If false, disables rubber band effect.
   * If number, enables rubber band effect with the specified coefficient.
   * If object, allows specifying coefficient and max distance.
   * Sheet-owned over-drag follows total finger displacement and holds until
   * touch-up or cancellation. Its resistance geometry is sampled when the
   * Sheet acquires the drag. Nested content uses its own native bounce settings
   * after handoff at the maximum snap; this option does not enable content bounce.
   * @zh 橡皮筋效果配置。
   * 默认情况下，垂直 Sheet（`top` / `bottom`）启用橡皮筋效果，水平抽屉（`left` / `right` / `start` / `end`）禁用。
   * 如果为 true，启用默认橡皮筋效果（系数 0.5）。
   * 如果为 false，禁用橡皮筋效果。
   * 如果为数字，启用指定系数的橡皮筋效果。
   * 如果为对象，允许指定系数和最大距离。
   * Sheet 的越界阻尼跟随手指累计位移，在抬手或取消前保持拖拽位置。
   * 阻尼几何参数在 Sheet 接管拖拽时采样。嵌套内容在最大吸附点交接后
   * 使用自身的原生回弹配置；此选项不会启用内容回弹。
   */
  rubberBand?: boolean | number | { coeff?: number, max?: number }
  /**
   * Whether to disable dragging on the Sheet.
   * @zh 是否禁用 Sheet 的拖拽。
   */
  dragDisabled?: boolean
  /**
   * The threshold to dismiss the Sheet.
   * @zh Sheet 关闭的阈值。
   */
  dismissThreshold?: number
  /**
   * Whether to restrict dragging to the handle only.
   * @zh 是否仅允许通过手柄拖拽。
   */
  handleOnly?: boolean
  /**
   * Whether to enable dragging to close the Sheet.
   * If true, dragging from the lowest snap point toward the closed edge will move the sheet linearly and allow dismissal.
   * If false, dragging toward the closed edge will trigger rubber band effect and snap back.
   * A fling toward the open edge returns to an open snap point, even from the dismiss zone.
   * @zh 是否允许拖拽关闭 Sheet。
   * 如果为 true，从最低吸附点向关闭边缘拖动将线性移动并允许关闭。
   * 如果为 false，向关闭边缘拖动将触发橡皮筋效果并回弹。
   * 向展开方向快速滑动时，即使已进入关闭区域，也会回到展开的吸附点。
   * @default true
   */
  enableDragToClose?: boolean
  /**
   * Angle ranges (in degrees) where gestures should be claimed by the Sheet.
   * Each entry is [minAngle, maxAngle]. Gestures within these angle ranges
   * will trigger sheet movement, while gestures outside these ranges are passed through.
   * see https://lynxjs.org/api/elements/built-in/view#consume-slide-event for more
   * @example [[-134, -46],[46, 134]] for claiming vertical gesture
   * @example [[-45, 45],[135, -135]] for claiming horizontal gesture
   * @zh Sheet 主动接管手势的角度范围（单位：度）。
   * 每个条目都是 `[最小角度, 最大角度]`。
   * 落在这些范围内的手势会驱动 Sheet 移动，范围外的手势则继续透传给子组件。
   */
  claimedGestureAngles?: [number, number][]

  /**
   * children
   * @zh 子元素
   * @Android
   * @iOS
   * @Harmony
   * @docTypeFallback ReactNode
   */
  children?: ReactNode
  /**
   * Whether to show the sheet. If this property is set, the sheet will be in controlled mode,
   * meaning the defaultShow property will have no effect. You must control the visibility
   * by updating this prop based on user interactions.
   * @zh 是否显示 Sheet。如果设置此属性，Sheet 将处于受控模式，defaultShow 属性将不生效。
   * 您必须根据用户交互更新此属性来控制可见性。
   * @Android
   * @iOS
   * @Harmony
   */
  show?: boolean
  /**
   * Whether the sheet should be shown by default. Use this for uncontrolled mode.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh Sheet 是否默认显示。使用此属性表示 Sheet 处于非受控模式。
   */
  defaultShow?: boolean
  /**
   * Mount the sheet and render its content even when not shown. The sheet remains in closed state.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 即使 Sheet 未显示也挂载并渲染内容。Sheet 仍保持关闭状态。
   */
  forceMount?: boolean
  /**
   * Called when the sheet's visibility is about to change (e.g., backdrop click, swipe dismiss, close button).
   * In controlled mode, use this to update your state. In uncontrolled mode, this is optional.
   * @Android
   * @iOS
   * @Harmony
   * @zh 当 Sheet 可见性即将改变时触发（例如点击背景、滑动关闭、关闭按钮）。
   * 在受控模式下，使用此回调更新状态。在非受控模式下，此回调可选。
   */
  onShowChange?: (open: boolean) => void
  /**
   * Called when the sheet has fully opened and any enter animation has finished.
   * @zh 当 Sheet 完全打开且入场动画结束时触发。
   * @Android
   * @iOS
   * @Harmony
   */
  onOpen?: () => void
  /**
   * Called when the sheet has fully closed and any exit animation has finished.
   * @zh 当 Sheet 完全关闭且退出动画结束时触发。
   * @Android
   * @iOS
   * @Harmony
   */
  onClose?: () => void
}

/**
 * The handle of the Sheet.
 * @zh Sheet 的拖拽手柄。
 */
export interface SheetHandleProps extends ComponentBasicProps {
  /**
   * children
   * @zh 子元素
   * @Android
   * @iOS
   * @Harmony
   */
  children?: ReactNode
}

/**
 * The view container of the Sheet. Can be `x-overlay-ng` or `view`.
 * Controls the Sheet's overlay layer and stacking order.
 * @zh Sheet 的视图容器，可以是 `x-overlay-ng` 或 `view`。
 * 用于控制 Sheet 所在的覆盖层及其层级顺序。
 */
export interface SheetViewProps extends ComponentBasicProps {
  /**
   * id
   * @Android
   * @iOS
   * @Harmony
   * @zh 标识符
   */
  id?: string
  /**
   * children
   * @Android
   * @iOS
   * @Harmony
   * @zh 子元素
   */
  children: ReactNode
  /**
   * If you want to render the Sheet outside of the LynxView, set this property.
   * The values 'spark', 'bullet', and 'bulletPopup' are names of native containers.
   * For example, on TikTok it should be 'spark', and on Douyin it should be 'bullet'.
   * On iOS, this prop can also be any native view controller that should host the Sheet.
   * Use it to place the Sheet in the correct native layer.
   * @Android
   * @iOS
   * @Harmony
   * @docTypeFallback 'spark' | 'bullet' | 'bulletPopup' | (string & {})
   * @zh 如果需要将 Sheet 渲染到 LynxView 外部，请设置此属性。
   * `'spark'`、`'bullet'` 和 `'bulletPopup'` 都是原生容器名称。
   * 例如在 TikTok 中通常应设置为 `'spark'`，在抖音中通常应设置为 `'bullet'`。
   * 在 iOS 上，这个属性也可以是任意一个用于承载 Sheet 的原生视图控制器。
   * 通过它可以将 Sheet 放到正确的原生层级中。
   */
  container?: 'spark' | 'bullet' | 'bulletPopup' | (string & {})
  /**
   * Only works when the 'container' is set to non-empty string. Adjust nearby elements display level.
   * @Android
   * @iOS
   * @Harmony
   * @zh 仅当 `container` 为非空字符串时生效。
   * 用于调整周边元素的显示层级。
   */
  overlayLevel?: 1 | 2 | 3 | 4
  /**
   * Additional props that will be passed through to the underlying element.
   * @zh 会透传到底层元素的额外属性。
   * @Android
   * @iOS
   * @Harmony
   */
  nativeProps?: OverlayViewProps['overlayViewProps']
}
