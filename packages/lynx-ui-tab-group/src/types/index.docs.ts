// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { ReactNode } from '@lynx-js/react'

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
  data: T[]
  /**
   * Return a stable, unique key for each tab. When omitted, the item index is
   * used. Provide this function when tabs can be inserted, removed, or reordered.
   * @Android
   * @iOS
   * @Harmony
   * @zh 返回每个 Tab 的稳定唯一键。省略时使用索引；当标签可能插入、删除或重排时请提供此函数。
   */
  getTabKey?: (tabItem: T, index: number) => string
  /**
   * children
   * @Android
   * @iOS
   * @Harmony
   * @zh 子节点
   */
  children?: ReactNode
  /**
   * Render each tab item. TabsItem reads its key from TabsBar automatically.
   * @Android
   * @iOS
   * @Harmony
   * @zh 渲染每个 Tab 项。TabsItem 会自动从 TabsBar 读取其键。
   */
  renderTabItem?: (tabItem: T, index: number) => ReactNode
}

export interface TabItemProps extends
  Omit<
    StandardProps,
    'bindtap' | 'main-thread:bindlayoutchange' | 'main-thread:ref'
  >
{
  /**
   * TabsBar supplies this automatically to items rendered by renderTabItem.
   * Set it for manually rendered items, matching the key derived from data.
   * @zh renderTabItem 渲染的 Tab 项会自动从 TabsBar 获取此键。手动渲染时需提供与数据对应的键。
   * @Android
   * @iOS
   * @Harmony
   */
  tabKey?: string
}

export type TabsPanelRef = ViewPagerRef

export interface TabsPanelProps<T = unknown>
  extends Omit<ViewPagerProps<T>, 'initialSelectIndex'>
{}

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
