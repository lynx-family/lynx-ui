// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Switch, SwitchThumb, SwitchTrack } from '@lynx-js/lynx-ui-switch'
import { clsx } from 'clsx'

import type { LunaSwitchProps } from '../types/index.docs.js'
import './index.css'

export function LunaSwitch({
  label,
  checked,
  defaultChecked,
  disabled,
  onChange,
  className,
  style,
}: LunaSwitchProps) {
  return (
    <Switch
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      onChange={onChange}
      className={clsx('lynx-ui-receipe-luna__switch', className)}
      style={style}
      switchProps={{
        'accessibility-element': true,
        'accessibility-label': label,
        'accessibility-role-description': 'switch',
        'accessibility-traits': disabled ? 'disabled' : undefined,
      }}
    >
      <SwitchTrack className='lynx-ui-receipe-luna__switch-track' />
      <SwitchThumb className='lynx-ui-receipe-luna__switch-thumb' />
    </Switch>
  )
}
