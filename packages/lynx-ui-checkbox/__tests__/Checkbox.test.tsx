// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { fireEvent, render } from '@lynx-js/react/testing-library'
import { describe, expect, it } from 'vitest'

import { Checkbox, CheckboxIndicator } from '../src'

function getCheckedStates(root: Element, indicator: Element) {
  return [
    root.classList.contains('ui-checked'),
    indicator.classList.contains('ui-checked'),
  ]
}

function createCheckbox(checkedProps: {
  checked?: boolean
  defaultChecked?: boolean
}) {
  return (
    <Checkbox className='checkbox-root' {...checkedProps}>
      <CheckboxIndicator className='checkbox-indicator' forceMount>
        <text>Indicator</text>
      </CheckboxIndicator>
    </Checkbox>
  )
}

describe('Checkbox', () => {
  it('applies ui-checked to the root when defaultChecked is true', () => {
    const { container } = render(createCheckbox({ defaultChecked: true }))
    const root = container.querySelector('.checkbox-root')!
    const indicator = container.querySelector('.checkbox-indicator')!

    expect(getCheckedStates(root, indicator)).toEqual([true, true])
  })

  it('keeps the root and indicator in sync after uncontrolled clicks', () => {
    const { container } = render(createCheckbox({ defaultChecked: false }))
    const root = container.querySelector('.checkbox-root')!
    const indicator = container.querySelector('.checkbox-indicator')!

    expect(getCheckedStates(root, indicator)).toEqual([false, false])
    fireEvent.tap(root)
    expect(getCheckedStates(root, indicator)).toEqual([true, true])
    fireEvent.tap(root)
    expect(getCheckedStates(root, indicator)).toEqual([false, false])
  })

  it('updates the root and indicator when controlled checked changes', () => {
    const { container, rerender } = render(createCheckbox({ checked: false }))
    const root = container.querySelector('.checkbox-root')!
    const indicator = container.querySelector('.checkbox-indicator')!

    expect(getCheckedStates(root, indicator)).toEqual([false, false])
    rerender(createCheckbox({ checked: true }))
    expect(getCheckedStates(root, indicator)).toEqual([true, true])
  })
})
