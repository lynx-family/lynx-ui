// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactElement } from '@lynx-js/react'

import type { CSSProperties } from '@lynx-js/types'

export interface SwiperProps<T> {
  /**
   * Swiper items data set
   * @Android
   * @iOS
   * @Harmony
   * @zh 轮播图数据集合
   */
  data: T[]
  /**
   * Width of swiper item
   * @Android
   * @iOS
   * @Harmony
   * @zh 轮播图项宽度
   */
  itemWidth: number
  /**
   * Height of SwiperItem
   * @Android
   * @iOS
   * @Harmony
   * @zh 轮播图项高度
   */
  itemHeight?: number | 'auto'
  /**
   * Children of Swiper should be a function, returning a SwiperItem
   * @Android
   * @iOS
   * @Harmony
   * @zh Swiper的子元素应该是一个函数，返回一个SwiperItem
   * @example
   * ```tsx
   * <Swiper
   *    data={items}
   *   itemWidth={350}
   *  >
   *    {({ index, item }) => (
   *      <SwiperItem index={index} key={index}>
   *        <image class="image" src={`${item}`}></image>
   *        <text class="image-text">Number.{index}</text>
   *      </SwiperItem>
   *    )}
   *  </Swiper>
   * ```
   */
  children: (prop: RenderFunctionProps<T>) => ReactElement
  /**
   * Width of swiper item
   * @defaultValue lynx.__globalProps.screenWidth
   * @Android
   * @iOS
   * @Harmony
   * @zh 轮播图容器的宽度
   */
  containerWidth?: number
  /**
   * Initial index of Swiper, this value will only be used at firstScreen. Later updates will be ignored.
   * @defaultValue 0
   * @Android
   * @iOS
   * @Harmony
   * @zh Swiper的初始索引，该值仅在首屏时使用。后续更新将被忽略。
   */
  initialIndex?: number
  /**
   * Swiper loop back
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 是否开启循环轮播
   */
  loop?: boolean
  /**
   * When loop is true, Swiper will duplicate the first 2 items and last 2 items to create a loop effect.
   * This prop can be used to customize how many items to duplicate the first and last item.
   * @defaultValue 2
   * @Android
   * @iOS
   * @Harmony
   * @zh 当loop为true时，Swiper会复制前2个和后2个项目来创建循环效果。此属性可用于自定义复制第一个和最后一个项目的数量。
   */
  loopDuplicateCount?: number
  /**
   * Duration of animation for paging or swiping
   * @defaultValue 500
   * @Android
   * @iOS
   * @Harmony
   * @zh 翻页或滑动动画的持续时间
   */
  duration?: number
  /**
   * Callback fired when currentIndex of Swiper has changed
   * @Android
   * @iOS
   * @Harmony
   * @zh 当前索引改变时的回调函数
   */
  onChange?: (current: number) => void
  /**
   * Callback fired when swiper started to swipe. Can be used with `onSwipeStop`.
   * This is useful for disabling clicking when swiping.
   * @Android
   * @iOS
   * @Harmony
   * @zh 开始滑动时的回调函数。可与`onSwipeStop`配合使用。用于在滑动时禁用点击事件。
   */
  onSwipeStart?: (current: number) => void
  /**
   * Callback fired when swiper stopped to swipe. Can be used with `onSwipeStart`.
   * This is useful for disabling clicking when swiping.
   * @Android
   * @iOS
   * @Harmony
   * @zh 停止滑动时的回调函数。可与`onSwipeStart`配合使用。用于在滑动时禁用点击事件。
   */
  onSwipeStop?: (current: number) => void
  /**
   * Callback fired when offset of Swiper changed.
   * Should be a MainThread function
   * @Android
   * @iOS
   * @Harmony
   * @zh Swiper偏移量改变时的回调函数。应该是一个主线程函数
   */
  'main-thread:onOffsetChange'?: (offset: number) => void
  /**
   * Custom easing function for paging effect
   * @Android
   * @iOS
   * @Harmony
   * @zh 自定义翻页效果的缓动函数
   */
  'main-thread:easing'?: (progress: number) => number
  /**
   * Custom animation effect, should be a MainThread function
   * @Android
   * @iOS
   * @Harmony
   * @zh 自定义动画效果，应该是一个主线程函数
   */
  'main-thread:customAnimation'?: (
    value: number,
    index: number,
  ) => CSSProperties
  /**
   * Custom animation effect used in JS, should be a JS function.
   * customAnimationFirstScreen should be a function of the same content of 'main-thread:customAnimation' without 'main thread' annotation
   * This is a workaround for MainThreadScript's disability for supporting firstScreen.
   * We are working on removing the duplicated JS version of customAnimation. For now, this is needed.
   * @Android
   * @iOS
   * @Harmony
   * @zh 在JS中使用的自定义动画效果，应该是一个JS函数。customAnimationFirstScreen应该是与'main-thread:customAnimation'内容相同的函数，但不带'main thread'注解。这是对MainThreadScript不支持首屏的临时解决方案。我们正在努力移除重复的JS版本的customAnimation。目前这是必需的。
   */
  customAnimationFirstScreen?: (value: number, index: number) => CSSProperties
  /**
   * Whether to enable autoPlay
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 是否启用自动播放
   */
  autoPlay?: boolean
  /**
   * Auto play interval
   * @defaultValue 2000
   * @Android
   * @iOS
   * @Harmony
   * @zh 自动播放间隔
   */
  autoPlayInterval?: number
  /**
   * Use this to limit or extend the offset of Swiper's range.
   * This can be useful for limiting offset to avoid overscroll.
   * For example, when mode === 'normal', and modeConfig.align === 'start', swipe to the last item technically means the last item's left
   * edge align with container's left edge, leaving a blank area, which usually is not what we want.
   * So we add an offsetLimit of [0, containerWidth - itemWidth], to limit the offset of Swiper.
   * In this case, when swipe to the end, the last item's right edge align with container's right edge, leaving no blank area.
   * @Android
   * @iOS
   * @Harmony
   * @zh 用于限制或扩展Swiper的偏移量范围。可用于限制偏移量以避免过度滚动。例如，当mode === 'normal'且modeConfig.align === 'start'时，滑动到最后一个项目技术上意味着最后一个项目的左边缘与容器的左边缘对齐，留下空白区域，这通常不是我们想要的。因此我们添加了offsetLimit为[0, containerWidth - itemWidth]，来限制Swiper的偏移量。在这种情况下，当滑动到末尾时，最后一个项目的右边缘与容器的右边缘对齐，不会留下空白区域。
   */
  offsetLimit?: [number, number]
  /**
   * BounceParams
   * @Android
   * @iOS
   * @Harmony
   * @zh 回弹参数配置
   */
  bounceConfig?: BounceConfig
  /**
   * key of Swiper Component. Change this will reset Swiper progress and state.
   * Can be used when reusing Swiper Component. Upon resting, `initialIndex` will be used again.
   * @Android
   * @iOS
   * @Harmony
   * @zh Swiper组件的key。更改此值将重置Swiper的进度和状态。可在重用Swiper组件时使用。重置时，将再次使用`initialIndex`。
   */
  swiperKey?: unknown
  /**
   * Whether to reset Swiper progress and state when reuse Swiper Component.
   * Can be useful when used in list.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 在重用Swiper组件时是否重置Swiper的进度和状态。
   */
  resetOnReuse?: boolean
  /**
   * Style for the root element of the Swiper component.
   * This controls the visible viewport/frame that contains the swiper.
   * Use this for: background, borders, padding, dimensions, overflow, etc.
   * @Android
   * @iOS
   * @Harmony
   * @zh Swiper组件根元素的样式。控制包含轮播图的可见视口/框架。用于：背景、边框、内边距、尺寸、溢出等。
   */
  style?: CSSProperties

  /**
   * Style for the inner sliding track that holds all swiper items.
   * This is the element that actually moves/slides.
   * @Android
   * @iOS
   * @Harmony
   * @zh 包含所有轮播项的内部滑动轨道的样式。这是实际移动/滑动的元素。
   */
  trackStyle?: CSSProperties
  /**
   * Determines how swiper respond to touch in different angle.
   * By default, swiper will only respond to horizontal touches.
   * Refer to https://lynxjs.org/en/api/elements/built-in/view.html#consume-slide-event for more
   * @defaultValue [[-180, -135], [-45, 45], [135, 180]]
   * @Android
   * @iOS
   * @Harmony
   * @zh 决定Swiper如何响应不同角度的触摸。默认情况下，Swiper只会响应水平方向的触摸。更多信息请参考 https://lynxjs.org/zh/api/elements/built-in/view.html#consume-slide-event
   */
  consumeSlideEvent?: [number, number][]
  /**
   * Whether to block native event.
   * Can be useful when swiper is in Scrollview, List or other components that will block swiper's touch event.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 是否阻止原生事件。当Swiper在Scrollview、List或其他会阻止Swiper触摸事件的组件中时可能有用。
   */
  blockNativeEvent?: boolean
  /**
   * Whether to enable RTL mode.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 是否启用RTL模式。
   */
  RTL?: boolean | 'lynx-rtl'
}

/**
 * @hidden
 */
export interface SwiperPropsNormal<T> extends SwiperProps<T> {
  /**
   * Mode of Swiper. Normal mode will make SwiperItem placed one after another.
   * Custom mode will make SwiperItem placed in absolute position in the most left.
   * This is used for complex modification and customLayout.
   * You need to return proper position of each SwiperItem in 'main-thread:customAnimation'
   * @defaultValue normal
   * @Android
   * @iOS
   * @Harmony
   * @zh Swiper的模式。普通模式会使SwiperItem依次排列。自定义模式会使SwiperItem以绝对定位方式放置在最左侧。这用于复杂的修改和自定义布局。你需要在'main-thread:customAnimation'中返回每个SwiperItem的正确位置
   */
  mode?: 'normal'
  /**
   * Additional config for mode
   * @Android
   * @iOS
   * @Harmony
   * @zh 模式的额外配置
   */
  modeConfig?: {
    /**
     * Alignment of SwiperItem.
     * @defaultValue start
     * @Android
     * @iOS
     * @Harmony
     * @zh `<SwiperItem>` 的对齐方式。
     */
    align?: 'start' | 'center' | 'end'
    /**
     * Space between SwiperItem
     * @defaultValue 0
     * @Android
     * @iOS
     * @Harmony
     * @zh `<SwiperItem>` 之间的间距
     */
    spaceBetween?: number
  }
}

/**
 * @hidden
 */
export interface SwiperPropsCustom<T> extends SwiperProps<T> {
  /**
   * Mode of Swiper. Normal mode will make SwiperItem placed one after another.
   * Custom mode will make SwiperItem placed in absolute position in the most left.
   * This is used for complex modification and customLayout.
   * You need to return proper position of each SwiperItem in 'main-thread:customAnimation'
   * @defaultValue normal
   * @Android
   * @iOS
   * @Harmony
   * @zh Swiper的模式。普通模式会使SwiperItem依次排列。自定义模式会使SwiperItem以绝对定位方式放置在最左侧。这用于复杂的修改和自定义布局。你需要在'main-thread:customAnimation'中返回每个SwiperItem的正确位置
   */
  mode?: 'custom'
  /**
   * Additional config for mode
   * @Android
   * @iOS
   * @Harmony
   * @zh 模式的额外配置
   */
  modeConfig?: Record<string, unknown>
}

export type SwiperPropsReal<T> = SwiperPropsNormal<T> | SwiperPropsCustom<T>

export interface SwipeToOptions {
  animate?: boolean
  onFinished?: () => void
}

export interface BounceConfig {
  /**
   * Whether to enable bounces. Ignored when loop is true.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 是否启用回弹效果。当loop为true时忽略此设置。
   */
  enable?: boolean
  /**
   * The left bounceItem (when in horizontal)
   * @Android
   * @iOS
   * @Harmony
   * @zh 左侧回弹项（水平方向时）
   */
  startBounceItem?: ReactElement
  /**
   * The right bounceItem (when in horizontal)
   * @Android
   * @iOS
   * @Harmony
   * @zh 右侧回弹项（水平方向时）
   */
  endBounceItem?: ReactElement
  /**
   * When startBounceItem is in bounce state, releasing finger will call this.
   * @Android
   * @iOS
   * @Harmony
   * @zh 当startBounceItem处于回弹状态时，释放手指将调用此函数。
   */
  onStartBounceItemBounce?: (bounceParams: onBounceParams) => void
  /**                       ·····   ··
   * When endBounceItem is in bounce state, releasing finger will call this.
   * @Android
   * @iOS
   * @Harmony
   * @zh 当endBounceItem处于回弹状态时，释放手指将调用此函数。
   */
  onEndBounceItemBounce?: (bounceParams: onBounceParams) => void
  /**
   * Width of bounceItem.
   * When overscroll the bounces, you will have larger and larger resistance, to make overscroll not exceed bounceItemWidth
   * @defaultValue 100
   * @Android
   * @iOS
   * @Harmony
   * @zh 回弹项的宽度。当过度滚动回弹时，你会感受到越来越大的阻力，以防止过度滚动超过bounceItemWidth
   */
  startBounceItemWidth?: number
  /**
   * Width of bounceItem.
   * When overscroll the bounces, you will have larger and larger resistance, to make overscroll not exceed bounceItemWidth
   * @defaultValue 100
   * @Android
   * @iOS
   * @Harmony
   * @zh 回弹项的宽度。当过度滚动回弹时，你会感受到越来越大的阻力，以防止过度滚动超过bounceItemWidth
   */
  endBounceItemWidth?: number
}

export interface SwiperRef {
  /**
   * SwiperTo item of index
   * @Android
   * @iOS
   * @Harmony
   * @zh 滑动到指定索引的项目
   */
  swipeTo: (index: number, options?: SwipeToOptions) => void
  /**
   * Swiper to next item
   * @Android
   * @iOS
   * @Harmony
   * @zh 滑动到下一个项目
   */
  swipeNext: () => void
  /**
   * Swiper to previous item
   * @Android
   * @iOS
   * @Harmony
   * @zh 滑动到上一个项目
   */
  swipePrev: () => void
  /**
   * Cancel Current Running Animation.
   * Use with caution, may break internal states.
   * @experimental
   * @Android
   * @iOS
   * @Harmony
   * @zh 取消当前正在运行的动画。谨慎使用，可能会破坏内部状态。
   */
  cancelAnimation: () => void
}

export interface onBounceParams {
  type: 'start' | 'end'
  offset: number
}

export interface RenderFunctionProps<T> {
  item: T
  index: number
  realIndex: number
}
