// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { fireEvent, render } from '@lynx-js/react/testing-library'
import { describe, expect, it, vi } from 'vitest'

import { Radio, RadioGroupRoot, RadioIndicator } from '../src'
import type { RadioGroupRootProps } from '../src'

function createGroup(props: RadioGroupRootProps) {
  return (
    <RadioGroupRoot {...props}>
      <Radio value='basic' className='basic'>
        <RadioIndicator className='basic-indicator' forceMount>
          <text>Basic indicator</text>
        </RadioIndicator>
        <text>Basic</text>
      </Radio>
      <Radio value='premium' className='premium'>
        <text>Premium</text>
      </Radio>
      <Radio value='disabled' disabled className='disabled'>
        <text>Disabled</text>
      </Radio>
    </RadioGroupRoot>
  )
}

describe('RadioGroupRoot.onValueSelect', () => {
  it('does not notify on mount or programmatic controlled value changes', () => {
    const onValueChange = vi.fn()
    const onValueSelect = vi.fn()
    const { rerender } = render(
      createGroup({ value: 'basic', onValueChange, onValueSelect }),
    )

    expect(onValueChange.mock.calls).toEqual([['basic']])
    expect(onValueSelect).not.toHaveBeenCalled()

    rerender(createGroup({ value: 'premium', onValueChange, onValueSelect }))

    expect(onValueChange.mock.calls).toEqual([['basic'], ['premium']])
    expect(onValueSelect).not.toHaveBeenCalled()
  })

  it('notifies for repeated uncontrolled selections while keeping state in sync', () => {
    const onValueChange = vi.fn()
    const onValueSelect = vi.fn()
    const { container } = render(
      createGroup({ defaultValue: 'premium', onValueChange, onValueSelect }),
    )
    const basic = container.querySelector('.basic')!
    const premium = container.querySelector('.premium')!
    const indicator = container.querySelector('.basic-indicator')!

    expect(onValueChange.mock.calls).toEqual([['']])
    expect(premium.classList.contains('ui-checked')).toBe(true)
    expect(onValueSelect).not.toHaveBeenCalled()

    fireEvent.tap(basic)
    fireEvent.tap(basic)

    expect(onValueSelect.mock.calls).toEqual([['basic'], ['basic']])
    expect(onValueChange.mock.calls).toEqual([[''], ['basic']])
    expect(basic.classList.contains('ui-checked')).toBe(true)
    expect(indicator.classList.contains('ui-checked')).toBe(true)
    expect(premium.classList.contains('ui-checked')).toBe(false)
  })

  it('reports controlled selections without changing the controlled value', () => {
    const onValueChange = vi.fn()
    const onValueSelect = vi.fn()
    const { container } = render(
      createGroup({ value: 'premium', onValueChange, onValueSelect }),
    )
    const basic = container.querySelector('.basic')!
    const premium = container.querySelector('.premium')!

    fireEvent.tap(basic)
    fireEvent.tap(basic)

    expect(onValueSelect.mock.calls).toEqual([['basic'], ['basic']])
    expect(onValueChange.mock.calls).toEqual([['premium'], ['basic']])
    expect(premium.classList.contains('ui-checked')).toBe(true)
    expect(basic.classList.contains('ui-checked')).toBe(false)
  })

  it('does not notify for a disabled item or disabled group', () => {
    const onValueSelect = vi.fn()
    const { container, rerender } = render(
      createGroup({ defaultValue: 'basic', onValueSelect }),
    )

    fireEvent.tap(container.querySelector('.disabled')!)
    expect(onValueSelect).not.toHaveBeenCalled()
    expect(container.querySelector('.basic')!.classList.contains('ui-checked'))
      .toBe(true)

    rerender(createGroup({ disabled: true, onValueSelect }))
    fireEvent.tap(container.querySelector('.premium')!)
    expect(onValueSelect).not.toHaveBeenCalled()
    expect(container.querySelector('.basic')!.classList.contains('ui-checked'))
      .toBe(true)
  })

  it('uses the latest callback after rerender', () => {
    const initialCallback = vi.fn()
    const nextCallback = vi.fn()
    const { container, rerender } = render(
      createGroup({ value: 'basic', onValueSelect: initialCallback }),
    )

    rerender(createGroup({ value: 'basic', onValueSelect: nextCallback }))
    fireEvent.tap(container.querySelector('.basic')!)

    expect(initialCallback).not.toHaveBeenCalled()
    expect(nextCallback.mock.calls).toEqual([['basic']])
  })

  it('reports selections from taps on Radio label children', () => {
    const onValueSelect = vi.fn()
    const { container, getByText } = render(
      createGroup({ defaultValue: 'premium', onValueSelect }),
    )

    fireEvent.tap(getByText('Basic'))

    expect(onValueSelect.mock.calls).toEqual([['basic']])
    expect(container.querySelector('.basic')!.classList.contains('ui-checked'))
      .toBe(true)
  })

  it('preserves selection behavior when the new callback is omitted', () => {
    const onValueChange = vi.fn()
    const { container } = render(createGroup({ onValueChange }))

    fireEvent.tap(container.querySelector('.basic')!)
    fireEvent.tap(container.querySelector('.basic')!)

    expect(onValueChange.mock.calls).toEqual([[''], ['basic']])
    expect(container.querySelector('.basic')!.classList.contains('ui-checked'))
      .toBe(true)
  })
})
