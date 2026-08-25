// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { themeTokens } from '../../data/tokens'

interface ThemeSelectProps {
  label: string
  onChange: (value: string) => void
  value: string
}

function ThemeSelect({ label, onChange, value }: ThemeSelectProps) {
  return (
    <label className='flex flex-col gap-2 text-sm text-content-muted'>
      {label}
      <select
        className='h-10 border border-line bg-paper px-3 text-base text-content focus:border-line focus:outline-none'
        onChange={event => onChange(event.target.value)}
        value={value}
      >
        {themeTokens.map(theme => (
          <option key={theme.key} value={theme.key}>
            {theme.key}
          </option>
        ))}
      </select>
    </label>
  )
}

export { ThemeSelect }
