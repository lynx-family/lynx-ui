// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useMemo, useState } from '@lynx-js/react'
import type { ReactNode } from '@lynx-js/react'

import { Button } from '@lynx-js/lynx-ui-button'
import {
  renderContentWithExtraProps,
  useMemoizedFn,
} from '@lynx-js/lynx-ui-common'
import { clsx } from 'clsx'

import { CheckboxContext } from './CheckboxContext'
import type { CheckboxProps } from './types'

export type { CheckboxProps, CheckboxIndicatorProps } from './types'
export const Checkbox = (props: CheckboxProps): ReactNode => {
  const {
    style,
    className,
    children,
    onChange,
    checked,
    defaultChecked = false,
    disabled = false,
    indeterminate = false,
    checkboxProps,
  } = props
  const isControlled = checked !== undefined
  const [uncontrolledChecked, setUncontrolledChecked] = useState<boolean>(
    defaultChecked,
  )
  const actualChecked = isControlled ? checked : uncontrolledChecked

  const handleValueChange = useMemoizedFn((newChecked: boolean) => {
    if (!isControlled) {
      setUncontrolledChecked(newChecked)
    }
    onChange?.(newChecked)
  })

  const handleClick = useMemoizedFn(() => {
    if (indeterminate) {
      handleValueChange(true)
      return
    }
    handleValueChange(!actualChecked)
  })

  const checkboxContextValue = useMemo(() => ({
    checked: actualChecked,
    indeterminate,
  }), [actualChecked, indeterminate])

  return (
    <CheckboxContext.Provider value={checkboxContextValue}>
      <Button
        disabled={disabled}
        onClick={handleClick}
        style={style}
        className={clsx(className, {
          'ui-indeterminate': indeterminate,
          'ui-checked': checked,
        })}
        buttonProps={checkboxProps}
      >
        {renderContentWithExtraProps(
          { checked: actualChecked, indeterminate },
          children,
        )}
      </Button>
    </CheckboxContext.Provider>
  )
}
