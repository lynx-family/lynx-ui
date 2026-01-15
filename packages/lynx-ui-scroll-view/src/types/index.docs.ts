// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactElement } from '@lynx-js/react'

import type { BaseGesture } from '@lynx-js/gesture-runtime'
import type {
  BaseScrollEvents,
  BaseUIExposureEvents,
  BaseUIExposureProps,
  BaseUILayoutEvents,
  BaseUITouchEvents,
  BounceableBasicProps,
  ComponentBasicProps,
  LazyOptions,
} from '@lynx-js/lynx-ui-common'
import type { CSSProperties } from '@lynx-js/types'

export type ScrollView = (props: ScrollViewProps) => ReactElement

type ScrollPropagationBehaviorOption =
  | 'native' // Follows platform default behavior
  | 'propagate' // Always allow scroll propagation
  // | 'propagateAtEdge' // @todo Child scrolls first; parent scrolls on next touch at edge
  | 'preventPropagate' // Never allow scroll propagation

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
export interface ScrollViewRef {}

export interface ScrollViewProps
  extends
    BaseUITouchEvents,
    BaseScrollEvents,
    BaseUIExposureEvents,
    BaseUILayoutEvents,
    BaseUIExposureProps,
    ComponentBasicProps
{
  /**
   * The id of the scrollview.
   * @zh 滚动视图的id。
   * @defaultValue "scrollview"
   * @Android
   * @iOS
   */
  scrollviewId?: string
  /**
   * Open the bouncing effect on iOS. If you want to use it on Android, please refer to the bounceableOption. If the bounceableOption is set, the iOSBounces property will be invalid.
   * @zh 开启iOS上的回弹效果。如果想在安卓上使用，请参考bounceableOption。如果设置了bounceableOption，iOSBounces属性将失效。
   * @defaultValue true
   * @Android
   * @iOS
   */
  iOSBounces?: boolean
  /**
   * Testing Mode.
   * @zh 测试模式
   * @Android
   * @iOS
   */
  testing?: boolean
  /**
   * Be used to mark the exposure timing of lazy loading. Please ensure that it is unique throughout the page.
   * @zh 用于标记懒加载的曝光时机。请确保页面中唯一。
   * @Android
   * @iOS
   * @deprecated Please use lazyOptions instead.
   */
  scene?: string
  /**
   * Horizontal scroll.
   * @zh 水平滚动。
   * @deprecated 3.119. Use scrollOrientation instead.
   * @Android
   * @iOS
   */
  horizontal?: boolean
  /**
   * Set to 'vertical' for vertical scrolling and set to 'horizontal' for horizontal scrolling.
   * @zh 设置为 'vertical' 为垂直滚动，设置为 'horizontal' 为水平滚动。
   * @defaultValue 'vertical'
   * @since 3.119
   * @iOS
   * @Android
   * @Harmony
   */
  scrollOrientation?: 'vertical' | 'horizontal'
  /**
   * When enabled, only the items that are about to enter the viewport are rendered, reducing initial load time and memory usage; remaining items are rendered as they approach visibility during scroll.
   * @zh 启用懒渲染。只有当用户滚动到可见区域时，才会渲染 items，从而减少初始加载时间和内存使用。
   * @defaultValue true
   * @Android
   * @iOS
   */
  lazyOptions?: LazyOptions
  /**
   * Estimated height and width of the items need to be set.
   * @zh 需要设置 items 的预计高度和宽度。
   * @Android
   * @iOS
   * @deprecated Please use lazyOptions instead.
   */
  estimatedItemStyle?: CSSProperties
  /**
   * When enabled, only the items that are about to enter the viewport are rendered, reducing initial load time and memory usage; remaining items are rendered as they approach visibility during scroll.
   * @zh 启用懒渲染。只有当用户滚动到可见区域时，才会渲染 items，从而减少初始加载时间和内存使用。
   * @defaultValue true
   * @Android
   * @iOS
   * @deprecated Please use lazyOptions instead.
   */
  lazy?: boolean
  /**
   * Sticky item, designed for `Tabs`.
   * @zh 粘性元素，设计用于 `Tabs`。
   * @Android
   * @iOS
   */
  sticky?: ReactElement
  /**
   * Children in scroll-view.
   * @zh `scroll-view` 的子元素。
   * @Android
   * @iOS
   */
  children?: (ReactElement[] | ReactElement)[] | ReactElement | ReactElement[]
  /**
   * exposure-screen-margin-top
   * @zh 曝光屏幕上方边距
   * @defaultValue '10px'
   * @Android
   * @iOS
   * @deprecated Please use lazyOptions instead.
   */
  exposureTop?: string
  /**
   * exposure-screen-margin-bottom
   * @zh 曝光屏幕下方边距
   * @defaultValue '10px'
   * @Android
   * @iOS
   * @deprecated Please use lazyOptions instead.
   */
  exposureBottom?: string
  /**
   * exposure-screen-margin-left
   * @zh 曝光屏幕左侧边距
   * @defaultValue '10px'
   * @Android
   * @iOS
   * @deprecated Please use lazyOptions instead.
   */
  exposureLeft?: string
  /**
   * exposure-screen-margin-right
   * @zh 曝光屏幕右侧边距
   * @defaultValue '10px'
   * @Android
   * @iOS
   * @deprecated Please use lazyOptions instead.
   */
  exposureRight?: string
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
   * Estimated first screen item count for lazy rendering. Remaining children will complete rendering based on exposure. When this estimate is small, it may cause a blank screen phenomenon where some nodes exist on the first screen.
   * @zh 懒加载时预计的第一页项数。剩余的子元素会基于曝光状态完成渲染。当此预估较小时，可能会导致第一屏出现空白现象。
   * @defaultValue 1
   * @Android
   * @iOS
   * @deprecated Please use lazyOptions instead.
   */
  firstScreenItemCount?: number
  /**
   * Enable bouncing effect
   * @zh 启用弹性效果
   * @Android
   * @iOS
   * @deprecated Please use bounceableOptions instead.
   */
  bounceable?: boolean
  /**
   * Props for bouncing effect
   * @zh 弹性效果的参数
   * @defaultValue { enableBounces: true, singleSidedBounce: "iOSBounces" },
   * @Android
   * @iOS
   */
  bounceableOptions?: boolean | BounceableBasicProps
  /**
   * Controls whether scroll events propagate to parent containers. For now, 'preventPropagate' needs to be used together with temporaryBlockScrollClass and temporaryBlockScrollTag on iOS.
   * @zh 控制滚动事件是否向父级容器传递。'preventPropagate' 在 iOS 上暂时需与 temporaryBlockScrollClass 和 temporaryBlockScrollTag 配合使用。
   * @experimental Currently, this property has limitations because its full functionality depends on a higher native SDK version: on iOS, `propagate` only works if both the parent and this component are set to` propagate` and `useRefactorList={true}` does not support 'propagate'. On Android, `preventPropagate` only functions when the parent is `x-swiper` or `x-viewpager-ng`.
   * @defaultValue 'native'
   * @iOS
   * @Android
   */
  scrollPropagationBehavior?: ScrollPropagationBehaviorOption
  /**
   * The specific class name of the container that is blocked when 'scrollPropagationBehavior' is set to be 'preventPropagate', must be informed by the container provider. For now, 'preventPropagate' needs to be used together with temporaryBlockScrollClass and temporaryBlockScrollTag on iOS.
   * @zh 当 scrollPropagationBehavior 设为 'preventPropagate' 时，被阻止滚动的容器的具体类名。'preventPropagate' 需与 temporaryBlockScrollClass 和 temporaryBlockScrollTag 配合使用。
   * This is a temporary props and will be deprecated on new Lynx SDK version.
   * @defaultValue 'BDXLynxViewPager'
   * @iOS
   */
  temporaryBlockScrollClass?: string
  /**
   * Used to specify the native container tag that is blocked when 'scrollPropagationBehavior' is set to be 'preventPropagate', corresponding to the Tag attribute of UIView. Needs to be specified by the native container provider. For now, 'preventPropagate' needs to be used together with temporaryBlockScrollClass and temporaryBlockScrollTag on iOS.
   * @zh 用于指定当 scrollPropagationBehavior 设为 'preventPropagate' 时被阻止滚动的原生容器标签（对应 UIView 的 Tag 属性）。该值需由原生容器提供方指定，且 'preventPropagate' 必须与 temporaryBlockScrollClass 和 temporaryBlockScrollTag 配合使用。
   * This is a temporary props and will be deprecated on new Lynx SDK version.
   * @defaultValue 0
   * @iOS
   */
  temporaryBlockScrollTag?: number
  /**
   * Android-only temporary flag to control nested scroll; maps to native 'enable-nested-scroll'. Android default value is true.
   * @zh 仅 Android 生效的临时开关，用于控制嵌套滚动冲突；映射到原生属性 'enable-nested-scroll'。Android上默认开启。
   * @Android
   */
  temporaryNestedScroll?: boolean
  /**
   * If you want to use gesture, pass it here.
   * @zh 如果想使用 gesture API，请传入该属性。
   * @iOS
   * @Android
   */
  'main-thread:gesture'?: BaseGesture

  /**
   * Android touch recognition mode. When inside a component that supports 'paging' mode, 'paging' must be enabled.
   * @zh Android 触摸识别模式，当处于支持 'paging' 模式的元件中时，需要开启 'paging' 模式。
   * @Android
   */
  androidTouchSlop?: 'default' | 'paging'

  /**
   * Being triggered when scrolling content changes.
   * @zh 滚动内容变化时触发。
   * @eventProperty
   * @Android
   * @iOS
   */
  onContentSizeChange?: (res: {
    detail: { scrollWidth: number, scrollHeight: number }
  }) => void
}

export const ScrollEventMapping: Record<string, string> = {
  onContentSizeChange: 'bindcontentsizechange',
}
