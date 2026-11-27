// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import type { CSSProperties, ViewProps } from '@lynx-js/types'

export interface OverlayViewRef {
  getRect: (handleLayoutUpdate: (e: unknown) => void) => void
}

export interface OverlayViewProps {
  /**
   * id
   * @zh 标识符
   * @Android
   * @iOS
   * @Harmony
   */
  id?: string
  /**
   * className
   * @zh 类名
   * @Android
   * @iOS
   * @Harmony
   */
  className?: string
  /**
   * style
   * @zh 样式
   * @Android
   * @iOS
   * @Harmony
   */
  style?: CSSProperties
  /**
   * children
   * @zh 子元素
   * @Android
   * @iOS
   * @Harmony
   */
  children?: ReactNode
  /**
   * It is recommended to use a full-screen transparent container for the popup, as it offers better performance. Alternatively, you can also choose to use the popup through an overlay
   * @zh 建议使用全屏透明容器来实现弹窗，这样性能更好。或者，你也可以选择通过覆盖层来使用弹窗。
   * @Android
   * @iOS
   * @Harmony
   */
  container?: string
  /**
   * Only works when the container is set to a native container name. Adjust the display level of nearby elements. Manual changes to overlayLevel are not supported after rendering.
   * @zh 仅在容器设置为原生容器名称时生效。调整附近元素的显示层级。一旦渲染后，不支持手动更改 overlayLevel。
   * @Android
   * @iOS
   * @Harmony
   */
  overlayLevel?: 1 | 2 | 3 | 4
  /**
   * Additional props that will be spread to the underlying element
   * @zh 将被直接传递到底层元素的额外属性
   * @Android
   * @iOS
   * @Harmony
   */
  overlayViewProps?: OverlayViewProps | ViewProps
  /**
   * Display debug logs. Open it when you find a bug.
   * @zh 显示调试日志。发现 bug 时开启。
   * @Android
   * @iOS
   * @Harmony
   */
  debugLog?: boolean
}
