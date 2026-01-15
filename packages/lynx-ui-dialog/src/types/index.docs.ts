// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'

import type { ComponentBasicProps } from '@lynx-js/lynx-ui-common'
import type { PresenceChildrenType } from '@lynx-js/lynx-ui-presence'
import type { OverlayProps, ViewProps } from '@lynx-js/types'

/**
 * The backdrop mask of the dialog.
 * @zh 弹窗的背景遮罩。
 */
export interface DialogBackdropProps extends ComponentBasicProps {
  /**
   * children
   * @zh 子元素
   * @Android
   * @iOS
   * @Harmony
   */
  children?: ReactNode
  /**
   * If the content needs a delayed first screen to do first render, you need to set this property to true.
   * @zh 如果内容需要延迟首屏进行首次渲染，则需要将此属性设置为 true。
   */
  delayed?: boolean
  /**
   * If set to true, the className will has the transition classes like 'ui-entering', 'ui-leaving', 'ui-animating'
   * @Android
   * @iOS
   * @Harmony
   * @zh 如果设置为 true，则 className 会包含 'ui-entering', 'ui-leaving', 'ui-animating' 等动画相关类名
   */
  transition?: boolean
  /**
   * Determines whether clicking on the backdrop closes the dialog.
   * This prop acts as a behavior switch for the backdrop's click event.
   *
   * When `true`, clicking the backdrop will trigger the `onClose` callback and close the dialog if the dialog is in uncontrolled mode (when `show` is not provided).
   * When `false`, clicking the backdrop will have no effect.
   * @defaultValue true
   * @Android
   * @iOS
   * @Harmony
   * @zh 确定点击背景是否关闭弹窗。此属性作为背景点击事件的行为开关。当值为 `true` 时，如果弹窗处于非受控模式（未提供 `show` 属性），点击背景将触发 `onClose` 回调并关闭弹窗。当值为 `false` 时，点击背景将没有任何效果。
   */
  clickToClose?: boolean
  /**
   * DialogBackdrop supports original view props to be directly spread in this prop.
   * @Android
   * @iOS
   * @Harmony
   * @zh DialogBackdrop 支持将原始 view 属性直接展开到这个属性中。
   */
  dialogBackdropProps?: ViewProps
  /**
   * Triggered when the backdrop is clicked.
   * @zh 点击背景时触发。
   * @Android
   * @iOS
   * @Harmony
   */
  onClick?: () => void
}

/**
 * The main content of the dialog.
 * @zh 弹窗的主要内容。
 */
export interface DialogContentProps extends ComponentBasicProps {
  /**
   * children
   * @zh 子元素
   * @Android
   * @iOS
   * @Harmony
   */
  children?: ReactNode
  /**
   * If the content needs a delayed first screen to do first render, you need to set this property to true.
   * @zh 如果内容需要延迟首屏进行首次渲染，则需要将此属性设置为 true。
   */
  delayed?: boolean
  /**
   * If set to true, the className will has the transition classes like 'ui-entering', 'ui-leaving', 'ui-animating'
   * @Android
   * @iOS
   * @Harmony
   * @zh 如果设置为 true，则 className 会包含 'ui-entering', 'ui-leaving', 'ui-animating' 等动画相关类名
   */
  transition?: boolean
  /**
   * DialogContent supports original view props to be directly spread in this prop.
   * @Android
   * @iOS
   * @Harmony
   * @zh DialogContent 支持将原始 view 属性直接展开到这个属性中。
   */
  dialogContentProps?: ViewProps
}

export type TriggerChildrenType = (
  DialogButtonStatus: { active: boolean, busy: boolean },
) => ReactNode

/**
 * The trigger of the dialog. Controls the display of the popper.
 * @zh 弹窗的触发组件。控制弹窗的显示
 */
export interface DialogTriggerProps extends ComponentBasicProps {
  /**
   * The content of the close component. It can be a function that returns a `ReactNode` or a `ReactNode` itself.
   * @Android
   * @iOS
   * @Harmony
   * @zh 关闭组件的内容。它可以是一个返回 `ReactNode` 的函数，也可以是一个 `ReactNode` 本身。
   */
  children:
    | TriggerChildrenType
    | ReactNode
  /**
   * Determines whether the close component is disabled.
   * When `true`, the component will be in a disabled state and cannot be interacted with.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 确定关闭组件是否被禁用。当值为 `true` 时，组件将处于禁用状态，无法进行交互。
   */
  disabled?: boolean
  /**
   * If set to true, the className will has the transition classes like 'ui-entering', 'ui-leaving', 'ui-animating'
   * @Android
   * @iOS
   * @Harmony
   * @zh 如果设置为 true，则 className 会包含 'ui-entering', 'ui-leaving', 'ui-animating' 等动画相关类名
   */
  transition?: boolean
}

/**
 * The close component of the Dialog, used to close the dialog.
 * @zh 弹窗的关闭组件，用于关闭弹窗。
 */
export interface DialogCloseProps extends ComponentBasicProps {
  /**
   * The content of the close component. It can be a function that returns a `ReactNode` or a `ReactNode` itself.
   * @Android
   * @iOS
   * @Harmony
   * @zh 关闭组件的内容。它可以是一个返回 `ReactNode` 的函数，也可以是一个 `ReactNode` 本身。
   */
  children:
    | TriggerChildrenType
    | ReactNode
  /**
   * Determines whether the close component is disabled.
   * When `true`, the component will be in a disabled state and cannot be interacted with.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 确定关闭组件是否被禁用。 当值为 `true` 时，组件将处于禁用状态，无法进行交互。
   */
  disabled?: boolean
  /**
   * If set to true, the className will has the transition classes like 'ui-entering', 'ui-leaving', 'ui-animating'
   * @Android
   * @iOS
   * @Harmony
   * @zh 如果设置为 true，则 className 会包含 'ui-entering', 'ui-leaving', 'ui-animating' 等动画相关类名
   */
  transition?: boolean
}
/**
 * The root component of the Dialog, containing all of its child components.
 * @zh 弹窗的根组件，包含其所有子组件。
 */
export interface DialogRootProps {
  /**
   * children
   * @zh 子元素
   * @Android
   * @iOS
   * @Harmony
   * @docTypeFallback ReactNode | (status: {open?: boolean, closed?: boolean, leaving?: boolean, entering?: boolean, animating?: boolean)} => ReactNode
   */
  children?: ReactNode | PresenceChildrenType
  /**
   * Whether to show the popper. If this property is not set, the popper will be in controlled mode, meaning the defaultShow property will take no effects. And you have to control behavior of clicking close button and backdrop.
   * @zh 是否显示弹出框。如果未设置此属性，弹出框将处于受控模式，这意味着 defaultShow 属性将无效。并且你必须控制点击关闭按钮和背景的行为。
   * @Android
   * @iOS
   * @Harmony
   */
  show?: boolean
  /**
   * Determines whether the dialog should be shown by default. Use this property means the Dialog is uncontrolled.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 确定弹窗是否默认显示。使用此属性意味着弹窗处于非受控模式。
   */
  defaultShow?: boolean
  /**
   * Mount the popper and render the content even when it's not shown. At this time, the internal state is "closed".
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   * @zh 即使弹窗未显示，也会挂载弹窗并渲染内容。此时内部状态处于 closed
   */
  forceMount?: boolean
  /**
   * Triggered when the dialog is about to be closed, which can be triggered by clicking the backdrop or via a close button. In controlled mode (when `show` is provided), you should use this handler to update the state that controls the dialog's visibility. In uncontrolled mode, this handler is optional and is called before the dialog's internal state is updated.
   * @Android
   * @iOS
   * @Harmony
   * @zh 当弹窗即将关闭时触发，可通过点击背景或关闭按钮触发。在受控模式下（提供了 `show` 属性），您应该使用此处理器来更新控制弹窗可见性的状态。在非受控模式下，此处理器是可选的，会在弹窗内部状态更新之前调用。
   */
  onShowChange?: (open: boolean) => void
  /**
   * Triggered when the popper is actually show and the potential animation is finished.
   * @zh 当弹出框实际显示且可能的动画结束时触发。
   * @Android
   * @iOS
   * @Harmony
   */
  onOpen?: () => void
  /**
   * Triggered when the popper is actually closed and the potential animation is finished.
   * @zh 当弹出框实际关闭且可能的动画结束时触发。
   * @Android
   * @iOS
   * @Harmony
   */
  onClose?: () => void
}

/**
 * View container. When 'container' is set correctly, the underlying layer will be replaced with overlay; otherwise, it will be a regular view. When the underlying layer is overlay, the 'level' property can be used to control the hierarchical relationship. For a regular view, use 'z-index' to control the hierarchical relationship. If this dialog needs to be used outside of LynxView, consider enabling overlay.
 * @zh 视图容器。当正确设置 'container' 时，底层将替换为 overlay；否则，将是一个普通视图。当底层为 overlay 时，可以使用 'level' 属性控制层级关系。对于普通视图，使用 'z-index' 控制层级关系。如果此弹窗需要在 LynxView 外部使用，考虑启用 overlay。
 */
export interface DialogViewProps extends ComponentBasicProps {
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
   * @docTypeFallback ReactNode | (status: {open?: boolean, closed?: boolean, leaving?: boolean, entering?: boolean, animating?: boolean)} => ReactNode
   */
  children:
    | ReactNode
    | PresenceChildrenType
  /**
   * If set to true, the className will has the transition classes like 'ui-entering', 'ui-leaving', 'ui-animating'
   * @Android
   * @iOS
   * @Harmony
   * @zh 如果设置为 true，则 className 会包含 'ui-entering', 'ui-leaving', 'ui-animating' 等动画相关类名
   */
  transition?: boolean
  /**
   * If you want to use the poppers outside of the LynxView, you need to set this property. The value is the name of the native container.
   * @Android
   * @iOS
   * @Harmony
   * @zh 如果你想在 LynxView 外部使用弹出框，则需要设置此属性。值为原生容器的名称。
   */
  container?: string
  /**
   * Only works when the 'container' is set to non-empty string. Adjust nearby elements display level.
   * @Android
   * @iOS
   * @Harmony
   * @zh 仅当 'container' 设置为非空字符串时有效。调整附近元素的显示层级。
   */
  overlayLevel?: 1 | 2 | 3 | 4
  /**
   * Display debug logs. Open it when you find a bug.
   * @Android
   * @iOS
   * @Harmony
   * @zh 显示调试日志。发现 bug 时开启。
   */
  debugLog?: boolean
  /**
   * Additional props that will be spread to the underlying OverlayView element
   * @zh 将被直接传递到底层 OverlayView 元素的额外 view 或 overlay 属性
   * @Android
   * @iOS
   * @Harmony
   */
  dialogViewProps?: OverlayProps | ViewProps
}
