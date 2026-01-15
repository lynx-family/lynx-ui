// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useContext } from '@lynx-js/react'
import type { ReactNode } from '@lynx-js/react'

import { ButtonContext } from '@lynx-js/lynx-ui-button'
import { clsx } from 'clsx'

import { CheckboxContext } from './CheckboxContext'
import type { CheckboxIndicatorProps } from './types'

export type { CheckboxProps, CheckboxIndicatorProps } from './types'

export const CheckboxIndicator = (props: CheckboxIndicatorProps): ReactNode => {
  const { children, className, style, forceMount = false } = props
  const { checked, indeterminate } = useContext(
    CheckboxContext,
  )
  const { active, disabled } = useContext(ButtonContext)

  return (
    <view
      style={style}
      className={clsx(className, {
        'ui-indeterminate': indeterminate,
        'ui-checked': checked,
        'ui-active': active,
        'ui-disabled': disabled,
      })}
    >
      {(forceMount || checked || indeterminate)
        && children}
    </view>
  )
}
