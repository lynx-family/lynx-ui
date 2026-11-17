// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Button } from '@lynx-js/lynx-ui-button'
import { clsx } from 'clsx'

import type { LunaButtonProps } from '../types/index.docs.js'
import './index.css'

export function LunaButton({
  children,
  variant = 'solid',
  disabled,
  onClick,
  className,
  style,
}: LunaButtonProps) {
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'lynx-ui-receipe-luna__button',
        `lynx-ui-receipe-luna__button--${variant}`,
        className,
      )}
      style={style}
      buttonProps={{
        'accessibility-element': true,
        'accessibility-label': children,
        'accessibility-traits': disabled ? 'disabled' : 'button',
      }}
    >
      <text className={`lynx-ui-receipe-luna__button-label--${variant}`}>
        {children}
      </text>
    </Button>
  )
}
