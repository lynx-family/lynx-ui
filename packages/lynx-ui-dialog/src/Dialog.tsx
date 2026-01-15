// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from '@lynx-js/react'
import { useContext, useMemo, useState } from '@lynx-js/react'

import { OverlayView } from '@lynx-js/lynx-ui-overlay'
import type { PresenceAnimationStatus } from '@lynx-js/lynx-ui-presence'
import {
  PresenceContext,
  PresenceState,
  presenceClassVariants,
  resolveAnimationStatus,
  usePresenceGroup,
} from '@lynx-js/lynx-ui-presence'

import { DialogButton, resolveBusyState } from './DialogButton'
import { DialogContext } from './DialogContext'
import type {
  DialogBackdropProps,
  DialogCloseProps,
  DialogContentProps,
  DialogRootProps,
  DialogTriggerProps,
  DialogViewProps,
} from './types'

type childType<T = PresenceState> = (groupState: T) => ReactNode
type renderChildrenType<T = PresenceState> = (
  children: childType<T> | ReactNode,
  status: T,
) => ReactNode

const renderedChildren: renderChildrenType<PresenceAnimationStatus> = (
  children,
  status,
) => {
  if (typeof children === 'function') {
    return children(status)
  }
  return children
}

export function DialogRoot(props: DialogRootProps) {
  const {
    show,
    defaultShow = false,
    forceMount = false,
    children,
    onOpen,
    onClose,
    onShowChange,
  } = props
  const isControlled = show !== undefined
  const [uncontrolledShow, setUncontrolledShow] = useState<boolean>(defaultShow)
  const actualShow = isControlled ? show : uncontrolledShow

  const [groupState, setGroupState] = useState<PresenceState>(
    actualShow ? PresenceState.Entering : PresenceState.Left,
  )

  const childrenStatus = resolveAnimationStatus({
    state: groupState,
    enableDelay: false,
    grouped: true,
  })

  const contextValue = useMemo(() => ({
    show: actualShow,
    forceMount,
    setUncontrolledShow,
    groupState,
    setGroupState,
    onOpen,
    onClose,
    onShowChange,
  }), [
    actualShow,
    forceMount,
    setUncontrolledShow,
    groupState,
    setGroupState,
    onOpen,
    onClose,
    onShowChange,
  ])

  return (
    <DialogContext.Provider value={contextValue}>
      {renderedChildren(children, childrenStatus)}
    </DialogContext.Provider>
  )
}

export function DialogTrigger(props: DialogTriggerProps) {
  const { className, transition } = props
  const { groupState } = useContext(DialogContext)
  const presenceClassName = presenceClassVariants({
    state: groupState,
    enableDelay: false,
    className,
    transition,
  })
  return (
    <DialogButton {...props} className={presenceClassName} changeShow={true} />
  )
}
export function DialogClose(props: DialogCloseProps) {
  const { className, transition } = props
  const { groupState } = useContext(DialogContext)
  const presenceClassName = presenceClassVariants({
    state: groupState,
    enableDelay: false,
    className,
    transition,
  })
  return (
    <DialogButton {...props} className={presenceClassName} changeShow={false} />
  )
}

export const DialogBackdrop = (props: DialogBackdropProps) => {
  const {
    children,
    className,
    style,
    clickToClose = true,
    transition,
    dialogBackdropProps,
    onClick,
  } = props
  const {
    animationHandlers,
    controllers,
  } = useContext(PresenceContext)
  const state = controllers.state
  const { setUncontrolledShow, onShowChange, groupState } = useContext(
    DialogContext,
  )
  const presenceClassName = presenceClassVariants({
    state,
    enableDelay: false,
    className,
    transition,
  })

  const {
    handleKFStart,
    handleKFEnd,
    handleTransitionEnd,
    handleTransitionStart,
  } = animationHandlers
  const busy = resolveBusyState(groupState)
  const handleClick = () => {
    if (!clickToClose || busy) {
      return
    }
    onShowChange?.(false)
    setUncontrolledShow(false)
    onClick?.()
  }

  return (
    <view
      className={presenceClassName}
      bindtap={handleClick}
      bindanimationstart={handleKFStart}
      bindanimationend={handleKFEnd}
      bindtransitionstart={handleTransitionStart}
      bindtransitionend={handleTransitionEnd}
      bindanimationcancel={handleKFEnd}
      event-through={false}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        ...style,
      }}
      {...dialogBackdropProps}
    >
      {children}
    </view>
  )
}

export const DialogView = (props: DialogViewProps) => {
  const {
    container,
    children,
    className,
    style,
    overlayLevel,
    transition,
    dialogViewProps,
  } = props

  const { show, forceMount, onClose, onOpen, groupState, setGroupState } =
    useContext(
      DialogContext,
    )

  const { mountView, renderChildren } = usePresenceGroup({
    show,
    forceMount,
    setGroupState,
    children,
    onOpen,
    onClose,
  })
  const presenceClassName = presenceClassVariants({
    state: groupState,
    enableDelay: false,
    className,
    transition,
    grouped: true,
  })

  return (
    (mountView || forceMount)
      ? (
        <OverlayView
          container={container}
          className={presenceClassName}
          style={{
            ...style,
            position: container ? 'relative' : 'fixed',
          }}
          overlayLevel={overlayLevel}
          // When the container is not given and the OverlayView is a normal view, attach the `native-interaction-enabled` prop to the view itself.
          // If this is not set, the default value on iOS is true while on Android it is false.
          overlayViewProps={container
            ? dialogViewProps
            : {
              'native-interaction-enabled': true,
              'flatten': false,
              ...dialogViewProps,
            }}
        >
          {renderChildren}
        </OverlayView>
      )
      : null
  )
}

export function DialogContent(props: DialogContentProps) {
  const { className, style, children, transition, dialogContentProps } = props
  const {
    animationHandlers,
    controllers,
  } = useContext(PresenceContext)
  const state = controllers.state

  const presenceClassName = presenceClassVariants({
    state,
    enableDelay: false,
    className,
    transition,
  })
  const {
    handleKFStart,
    handleKFEnd,
    handleTransitionEnd,
    handleTransitionStart,
  } = animationHandlers

  return (
    <view
      className={presenceClassName}
      overlap={false}
      style={style}
      event-through={false}
      bindanimationstart={handleKFStart}
      bindanimationend={handleKFEnd}
      bindtransitionstart={handleTransitionStart}
      bindtransitionend={handleTransitionEnd}
      bindanimationcancel={handleKFEnd}
      {...dialogContentProps}
    >
      {children}
    </view>
  )
}
