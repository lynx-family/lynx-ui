// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useState } from '@lynx-js/react'

import { cn } from '../../../utils'

interface SwitchProps {
  size?: 'sm' | 'lg'
  defaultChecked?: boolean
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

function Switch(
  {
    size = 'sm',
    defaultChecked = false,
    checked: checkedProp,
    onCheckedChange,
    disabled = false,
  }: SwitchProps,
) {
  const isControlled = checkedProp !== undefined
  const [uncontrolledChecked, setUncontrolledChecked] = useState(
    defaultChecked,
  )

  const checked = isControlled ? checkedProp : uncontrolledChecked

  const handleToggle = () => {
    if (disabled) return
    const next = !checked
    if (!isControlled) {
      setUncontrolledChecked(next)
    }
    onCheckedChange?.(next)
  }

  return (
    <view
      className={cn(
        'rounded-full overflow-hidden flex flex-row items-center ui-disabled:opacity-50 active:opacity-80',
        size === 'sm' && 'w-[38px] h-[22px]',
        size === 'lg' && 'w-[48px] h-[28px]',
        disabled && 'ui-disabled',
      )}
      bindtap={handleToggle}
    >
      {/* Track */}
      <view
        className={cn(
          'size-full transition-all bg-neutral-faint ui-checked:bg-primary',
          checked && 'ui-checked',
        )}
      />
      {/* Thumb */}
      <view
        className={cn(
          'absolute rounded-full bg-primary-content transform-[translateX(3px)] transition-all shadow',
          checked && 'ui-checked',
          size === 'sm'
            && 'size-[16px] ui-active:w-[24px] ui-checked:transform-[translateX(19px)] ui-checked:ui-active:transform-[translateX(11px)]',
          size === 'lg'
            && 'size-[22px] ui-active:w-[33px] ui-checked:transform-[translateX(23px)] ui-checked:ui-active:transform-[translateX(12px)]',
          __WEB__ && size === 'sm'
            && 'active:w-[24px] ui-checked:active:transform-[translateX(11px)]',
          __WEB__ && size === 'lg'
            && 'active:w-[33px] ui-checked:active:transform-[translateX(12px)]',
        )}
      />
      <view />
    </view>
  )
}

export { Switch }
