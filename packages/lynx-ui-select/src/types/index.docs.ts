// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CSSProperties, ViewProps } from '@lynx-js/types'

/**
 * Option config for Select.
 */
export interface SelectOption {
  /**
   * Option label.
   */
  label: string
  /**
   * Option value.
   */
  value: string
  /**
   * Whether this option is disabled.
   * @defaultValue false
   */
  disabled?: boolean
}

/**
 * Props for Select.
 */
export interface SelectProps {
  /**
   * Controlled value.
   */
  value?: string
  /**
   * Initial value in uncontrolled mode.
   */
  defaultValue?: string
  /**
   * Option list.
   */
  options: SelectOption[]
  /**
   * Called when selected value changes.
   */
  onValueChange?: (value: string) => void
  /**
   * Class name of Select container.
   */
  className?: string
  /**
   * Style of Select container.
   */
  style?: CSSProperties
  /**
   * Class name applied to each option.
   */
  optionClassName?: string
  /**
   * Style applied to each option.
   */
  optionStyle?: CSSProperties
  /**
   * Additional native props for Select container.
   */
  containerProps?: ViewProps
  /**
   * Additional native props for each option item.
   */
  optionProps?: ViewProps
}
