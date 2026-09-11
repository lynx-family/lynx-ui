// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useContext } from '@lynx-js/react'

import { OverlayView } from '@lynx-js/lynx-ui-overlay'
import { presenceClassVariants } from '@lynx-js/lynx-ui-presence'

import { ToastContext } from './toastContext'
import type { ToastPositionerProps } from './types'

// Toast have to use x-overlay-ng to make the event passes to other nodes correctly.
// e.g.: If it uses a normal view here and the view overlaps the trigger button, we can't make the button and the content inside it receives the event simultaneously.
// The user-interaction-enabled={false} will ban all touch events inside this view.
export const ToastPositioner = (props: ToastPositionerProps) => {
  const {
    container = 'window',
    className,
    transition,
    toastPositionerProps,
    ...rest
  } = props
  const { toastId, state } = useContext(ToastContext)
  const presenceClassName = presenceClassVariants({
    state,
    enableDelay: true,
    className,
    transition,
  })
  const toastIdStr = `lynx-ui-toast-positioner-${toastId}`
  return (
    <OverlayView
      container={container}
      id={toastIdStr}
      className={presenceClassName}
      overlayViewProps={toastPositionerProps}
      {...rest}
    />
  )
}
