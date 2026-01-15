// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext, useContext, useMemo, useState } from '@lynx-js/react'
import type { ReactNode } from '@lynx-js/react'

import { clsx } from 'clsx'

import { render } from './render'
import type {
  SwitchProps,
  SwitchRenderProps,
  SwitchThumbProps,
  SwitchTrackProps,
} from './types'
import { usePressTap } from './use-press-tap'

const SwitchContext = createContext<SwitchRenderProps>({
  checked: false,
  disabled: false,
  active: false,
})

function Switch({
  style,
  className,
  children,
  onChange,
  checked: checkedProp,
  defaultChecked = false,
  disabled = false,
  switchProps,
}: SwitchProps): ReactNode {
  const isControlled = checkedProp !== undefined

  const [uncontrolledChecked, setUncontrolledChecked] = useState<boolean>(
    defaultChecked,
  )

  const checked = isControlled ? checkedProp : uncontrolledChecked

  const handleChange = () => {
    const next = !checked
    if (!isControlled) {
      setUncontrolledChecked(next)
    }
    onChange?.(next)
  }

  const { pressed, bindtap, bindtouchcancel, bindtouchend, bindtouchstart } =
    usePressTap({ disabled, onTap: handleChange })

  const active = useMemo(() => pressed && !disabled, [pressed, disabled])

  const switchContextValue: SwitchRenderProps = useMemo(() => ({
    active,
    checked,
    disabled,
  }), [active, checked, disabled])

  return (
    <SwitchContext.Provider value={switchContextValue}>
      <view
        bindtap={bindtap}
        bindtouchstart={bindtouchstart}
        bindtouchend={bindtouchend}
        bindtouchcancel={bindtouchcancel}
        event-through={false}
        style={style}
        className={clsx(className, {
          'ui-active': active,
          'ui-checked': checked,
          'ui-disabled': disabled,
        })}
        {...switchProps}
      >
        {render<SwitchRenderProps>(switchContextValue, children)}
      </view>
    </SwitchContext.Provider>
  )
}

function SwitchThumb(props: SwitchThumbProps): ReactNode {
  const { children, className, style } = props
  const { active, checked, disabled } = useContext(SwitchContext)

  return (
    <view
      style={style}
      className={clsx(className, {
        'ui-active': active,
        'ui-checked': checked,
        'ui-disabled': disabled,
      })}
    >
      {children}
    </view>
  )
}

function SwitchTrack(props: SwitchTrackProps): ReactNode {
  const { children, className, style } = props
  const { active, checked, disabled } = useContext(SwitchContext)

  return (
    <view
      style={style}
      className={clsx(className, {
        'ui-active': active,
        'ui-checked': checked,
        'ui-disabled': disabled,
      })}
    >
      {children}
    </view>
  )
}

export { Switch, SwitchThumb, SwitchTrack }
