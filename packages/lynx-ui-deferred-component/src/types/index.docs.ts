// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactElement } from '@lynx-js/react'

import type { CSSProperties } from '@lynx-js/types'

export type DeferredComponent = (props: DeferredComponentProps) => ReactElement

/**
 * Reserved ref interface. No imperative methods are exposed.
 * @zh 预留的引用接口，不提供命令式方法。
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- reserved public ref contract
export interface DeferredComponentRef {}

export interface DeferredComponentProps {
  /**
   * Estimated style applied to the wrapper before and after children appear.
   * @zh 应用于容器的预估样式，在子节点显示前后持续生效。
   * @Android
   * @iOS
   */
  estimatedStyle?: CSSProperties
  /**
   * Content displayed until the delayed children appear.
   * @zh 延迟加载的子节点显示前的占位节点。
   * @Android
   * @iOS
   */
  placeholder?: ReactElement
  /**
   * Frames to delay rendering children. The first layout counts as the first
   * frame. Values below 1 and non-finite values (NaN or either Infinity) render
   * children immediately without a wrapper.
   * @zh 延迟显示子节点的帧数，首次布局计为第一帧；小于 1 或非有限值（NaN、正负无穷）时直接渲染子节点，不创建容器。
   * @defaultValue 1
   * @Android
   * @iOS
   */
  delayFrames?: number
  /**
   * Child element to render after the delay.
   * @zh 延迟后渲染的子节点。
   * @Android
   * @iOS
   */
  children: ReactElement
  /**
   * Called for wrapper layout events after children appear. The initial layout
   * that starts the delay does not invoke this callback. Disabled delays render
   * children directly and do not report wrapper layout events.
   * @zh 子节点显示后的容器布局回调。开始延迟的首次布局不会触发；关闭延迟时直接渲染子节点，不报告容器布局事件。
   * @docTypeFallback (event: { width: number; height: number }) => void
   * @Android
   * @iOS
   */
  onLayoutChange?: (event: { width: number, height: number }) => void
}
