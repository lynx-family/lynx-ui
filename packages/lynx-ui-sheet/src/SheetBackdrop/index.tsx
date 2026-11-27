// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { runOnBackground, useMainThreadRef } from '@lynx-js/react'

import { useMemoizedFn } from '@lynx-js/lynx-ui-common'
import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { createMotionValue } from '@lynx-js/motion/mini'
import type { MainThread } from '@lynx-js/types'
import { clsx } from 'clsx'

import { useSheetContext } from '../context'
import type { SheetBackdropProps } from '../types'

export function SheetBackdrop(props: SheetBackdropProps) {
  const { clickToClose = true, onClick, children, style, className } = props
  const {
    mounted,
    show,
    sheetProgress,
    setUncontrolledShow,
    onShowChange,
    presenceStateMTRef,
  } = useSheetContext()
  const active = Boolean(mounted || show)
  const overlayMTRef = useMainThreadRef<MainThread.Element | null>(null)
  const lastOpacityMTRef = useMainThreadRef<string>('')
  const unsubscribeProgressMTRef = useMainThreadRef<(() => void) | null>(null)

  function setBackdropMTRef(element: MainThread.Element | null) {
    'main thread'
    unsubscribeProgressMTRef.current?.()
    unsubscribeProgressMTRef.current = null
    overlayMTRef.current = element
    if (!element || !sheetProgress) return
    lastOpacityMTRef.current = '0'
    if (!sheetProgress.current) {
      sheetProgress.current = createMotionValue(0)
    }
    const initialProgress = sheetProgress.current.get()
    if (initialProgress > 0) {
      const nextOpacity = String(initialProgress)
      lastOpacityMTRef.current = nextOpacity
      element.setStyleProperties({
        opacity: nextOpacity,
      })
    }
    unsubscribeProgressMTRef.current = sheetProgress.current.on(
      'change',
      (v) => {
        'main thread'
        const nextOpacity = String(v)
        if (lastOpacityMTRef.current === nextOpacity) return
        lastOpacityMTRef.current = nextOpacity
        overlayMTRef.current?.setStyleProperties({
          opacity: nextOpacity,
        })
      },
    )
  }

  const handleClick = useMemoizedFn(() => {
    if (clickToClose) {
      // onShowChange triggers the close animation flow via handleShowChange in SheetRoot
      onShowChange?.(false)
      // setUncontrolledShow updates state for uncontrolled mode
      setUncontrolledShow(false)
    }
    onClick?.()
  })

  function handleClickMT() {
    'main thread'
    if (
      presenceStateMTRef
      && presenceStateMTRef.current !== PresenceState.Entered
    ) {
      return
    }

    runOnBackground(handleClick)()
  }

  return (
    <view
      main-thread:ref={setBackdropMTRef}
      className={clsx('lynx-ui-sheet-backdrop', className)}
      main-thread:bindtap={handleClickMT}
      event-through={!active}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        pointerEvents: active ? 'auto' : 'none',
        opacity: 0,
        ...style,
      }}
    >
      {children}
    </view>
  )
}
