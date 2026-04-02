// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext, useContext, useMemo, useState } from '@lynx-js/react'

import { useMemoizedFn } from '@lynx-js/lynx-ui-common'
import { clsx } from 'clsx'

import type { ButtonProps } from './types'

export const ButtonContext = createContext<{
  active: boolean
  disabled: boolean
}>({
  active: false,
  disabled: false,
})

export const useButtonContext = () => useContext(ButtonContext)

export const Button = (prop: ButtonProps) => {
  const {
    children,
    onClick,
    disabled = false,
    style,
    className,
    buttonProps,
  } = prop
  const [active, setActive] = useState(false)

  // Only when the button is active and not disabled, the active style will be applied
  const isEffectiveActive = active && !disabled

  const renderedChildren = typeof children === 'function'
    ? children({ active: isEffectiveActive, disabled })
    : children

  const handleTouchStart = useMemoizedFn(() => {
    if (disabled) return
    setActive(true)
  })

  const handleTouchEnd = useMemoizedFn(() => {
    setActive(false)
    if (disabled) return
  })

  const handleTap = useMemoizedFn(() => {
    if (disabled) return
    onClick?.()
  })

  const contextValue = useMemo(
    () => ({ active: isEffectiveActive, disabled }),
    [isEffectiveActive, disabled],
  )

  return (
    <ButtonContext.Provider value={contextValue}>
      <view
        bindtap={handleTap}
        bindtouchstart={handleTouchStart}
        bindtouchend={handleTouchEnd}
        bindtouchcancel={handleTouchEnd}
        event-through={false}
        style={style}
        className={clsx(className, {
          'ui-active': isEffectiveActive,
          'ui-disabled': disabled,
        })}
        {...buttonProps}
      >
        {renderedChildren}
      </view>
    </ButtonContext.Provider>
  )
}
