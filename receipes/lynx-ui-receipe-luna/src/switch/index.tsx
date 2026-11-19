// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  Switch as HeadlessSwitch,
  SwitchThumb,
  SwitchTrack,
} from '@lynx-js/lynx-ui-switch'
import { clsx } from 'clsx'

import type { SwitchProps } from '../types/index.docs.js'
import './index.css'

export function Switch({
  'accessibility-label': accessibilityLabel,
  checked,
  defaultChecked,
  disabled,
  onCheckedChange,
  className,
  style,
}: SwitchProps) {
  return (
    <HeadlessSwitch
      checked={checked}
      defaultChecked={defaultChecked}
      disabled={disabled}
      onChange={onCheckedChange}
      className={clsx('lynx-ui-receipe-luna__switch', className)}
      style={style}
      switchProps={{
        'accessibility-element': true,
        'accessibility-label': accessibilityLabel,
        'accessibility-role-description': 'switch',
        'accessibility-traits': disabled ? 'disabled' : undefined,
      }}
    >
      <SwitchTrack className='lynx-ui-receipe-luna__switch-track' />
      <SwitchThumb className='lynx-ui-receipe-luna__switch-thumb' />
    </HeadlessSwitch>
  )
}
