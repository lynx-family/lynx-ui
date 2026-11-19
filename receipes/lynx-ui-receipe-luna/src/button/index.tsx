// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Button as HeadlessButton } from '@lynx-js/lynx-ui-button'
import { clsx } from 'clsx'

import type { ButtonProps } from '../types/index.docs.js'
import './index.css'

export function Button({
  children,
  variant = 'solid',
  disabled,
  onClick,
  className,
  style,
}: ButtonProps) {
  return (
    <HeadlessButton
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
    </HeadlessButton>
  )
}
