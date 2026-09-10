// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { ForwardedRef, ReactNode } from '@lynx-js/react'

import type { ComponentBasicProps } from '@lynx-js/lynx-ui-common'
import type { ScrollViewProps } from '@lynx-js/lynx-ui-scroll-view'
import type { ViewPagerProps, ViewPagerRef } from '@lynx-js/lynx-ui-view-pager'
import type { StandardProps } from '@lynx-js/types'

export interface TabsIndicatorAnimationSpring {
  /**
   * Use a spring transition for indicator motion.
   * @zh 使用弹簧过渡驱动指示器动画。
   */
  type?: 'spring'
  /**
   * The spring stiffness of the indicator motion.
   * @zh 指示器动画的弹簧刚度。
   */
  stiffness?: number
  /**
   * The spring damping of the indicator motion.
   * @zh 指示器动画的弹簧阻尼。
   */
  damping?: number
  /**
   * The spring mass of the indicator motion.
   * @zh 指示器动画的弹簧质量。
   */
  mass?: number
  /**
   * The initial velocity of the spring animation.
   * @zh 弹簧动画的初始速度。
   */
  velocity?: number
}

export interface TabsIndicatorAnimationTween {
  /**
   * Use a tween transition for indicator motion.
   * @zh 使用补间过渡驱动指示器动画。
   */
  type: 'tween'
  /**
   * The tween duration in milliseconds.
   * @zh 补间动画时长，单位为毫秒。
   */
  duration?: number
  /**
   * The easing function of the tween animation.
   * @zh 补间动画的缓动函数。
   */
  ease?: (t: number) => number
}

export type TabsIndicatorAnimation =
  | TabsIndicatorAnimationSpring
  | TabsIndicatorAnimationTween

export interface TabsRootProps {
  /**
   * The index of the initial display. Please use `selectTab` for other updates.
   * @zh 指定初始显示的索引。请使用 `selectTab` 进行其他更新。
   * @defaultValue 0
   * @Android
   * @iOS
   */
  initialSelectIndex?: number
  /**
   * children
   * @Android
   * @iOS
   * @Harmony
   * @zh 子节点
   */
  children?: ReactNode
  /**
   * Controls how the tab bar scrolls and how the indicator moves when a tab is
   * selected. Use `'smooth'` to animate the transition, or `'instant'` to jump
   * to the target tab without animation.
   * @zh 控制选中标签时标签栏的滚动方式与指示器的移动方式。`'smooth'` 表示动画过渡，`'instant'` 表示直接跳转。
   * @defaultValue 'smooth'
   * @Android
   * @iOS
   */
  selectBehavior?: 'smooth' | 'instant'
  /**
   * The animation configuration for the tab indicator when switching tabs.
   * @zh 切换标签时指示器的动画配置。
   * @defaultValue { type: 'spring', stiffness: 300, damping: 30, mass: 1 }
   * @Android
   * @iOS
   * @Harmony
   */
  indicatorAnimation?: TabsIndicatorAnimation

  /**
   * Click callback
   * @zh 点击回调
   * @eventProperty
   * @Android
   * @iOS
   */
  onClickItem?: (index: number) => void
  /**
   * Tab change callback
   * @zh 标签页更改回调
   * @eventProperty
   * @Android
   * @iOS
   */
  onTabChanged?: (index: number) => void

  /**
   * Display debug logs. Open it when you find a bug.
   * @zh 显示调试日志。当您发现错误时，请打开此选项。
   * @defaultValue false
   * @iOS
   * @Android
   * @Harmony
   */
  debugLog?: boolean

  /**
   * Enable RTL layout.
   * @zh 开启 RTL 布局。
   * @defaultValue false
   * @iOS
   * @Android
   * @Harmony
   */
  enableRTL?: boolean
}

export interface TabsRootRef {
  selectTab: (index: number, smooth: boolean) => void
}

export interface TabsData<T> {
  /**
   * A function that returns the unique key for every Tab.
   * @Android
   * @iOS
   * @Harmony
   * @zh 返回每个 Tab 项的唯一键的函数。
   */
  getTabKey: () => string
  /**
   * The original data item for the Tab.
   * @Android
   * @iOS
   * @Harmony
   * @zh 用于渲染 Tab 的原始数据项。
   */
  tabItem: T
}

export interface TabsBarProps<T>
  extends Omit<ScrollViewProps, 'children' | 'horizontal' | 'scrollOrientation'>
{
  /**
   * The class apply to the internal container of child view inside scroll-view.
   * @zh 应用于 scroll-view 内子视图的内部容器的类名。
   * @Android
   * @iOS
   */
  tabsItemWrapperClass?: string
  /**
   * The data for the Tabs.
   * @Android
   * @iOS
   * @Harmony
   * @zh Tabs 的数据。
   */
  data: TabsData<T>[]
  /**
   * children
   * @Android
   * @iOS
   * @Harmony
   * @zh 子节点
   */
  children?: ReactNode
  /**
   * The function used to render each tab item.
   * @Android
   * @iOS
   * @Harmony
   * @zh 用于渲染每一个 Tab 的函数。
   */
  renderTabItem?: (tabItem: TabsData<T>) => ReactNode
}

export interface TabItemProps extends StandardProps {
  /**
   * The unique key of the tab item.
   * @zh Tab 项的唯一键。
   * @Android
   * @iOS
   * @Harmony
   */
  tabKey: string
}

export interface TabsPanelRef extends ViewPagerRef {}

export interface TabsPanelProps extends Omit<ViewPagerProps, 'ref'> {
  ref?: ForwardedRef<TabsPanelRef>
}

export interface TabsIndicatorProps extends ComponentBasicProps {
  /**
   * Raw props passed to the indicator.
   * @Android
   * @iOS
   * @Harmony
   * @zh TabsIndicator 的原始属性。
   */
  indicatorProps?: StandardProps
  /**
   * children
   * @Android
   * @iOS
   * @Harmony
   * @zh 子节点
   */
  children?: ReactNode
}
