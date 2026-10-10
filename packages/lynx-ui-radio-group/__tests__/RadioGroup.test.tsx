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
          <text>Indicator</text>
        </RadioIndicator>
        <text>Basic</text>
      </Radio>
      <Radio value='premium' className='premium'>
        <text>Premium</text>
      </Radio>
      <Radio value='' className='empty'>
        <text>Empty</text>
      </Radio>
      <Radio value='disabled' disabled className='disabled'>
        <text>Disabled</text>
      </Radio>
    </RadioGroupRoot>
  )
}

describe('RadioGroupRoot.onValueChange', () => {
  it.each([
    { props: { value: 'basic' }, selected: 'basic' },
    { props: { defaultValue: 'basic' }, selected: 'basic' },
    { props: { value: '' }, selected: 'empty' },
    { props: {}, selected: null },
  ])('initializes silently with $props', ({ props, selected }) => {
    const onValueChange = vi.fn()
    const { container } = render(createGroup({ ...props, onValueChange }))

    expect(onValueChange).not.toHaveBeenCalled()
    expect(container.querySelector('view.ui-checked')?.classList[0] ?? null)
      .toBe(selected)
  })

  it('notifies once for each different uncontrolled selection', () => {
    const onValueChange = vi.fn()
    const { container } = render(
      createGroup({ defaultValue: 'premium', onValueChange }),
    )
    const basic = container.querySelector('.basic')!
    const premium = container.querySelector('.premium')!

    fireEvent.tap(premium)
    expect(onValueChange).not.toHaveBeenCalled()

    fireEvent.tap(basic)
    fireEvent.tap(basic)

    expect(onValueChange.mock.calls).toEqual([['basic']])
    expect(basic.classList.contains('ui-checked')).toBe(true)
    expect(
      container.querySelector('.basic-indicator')!.classList.contains(
        'ui-checked',
      ),
    )
      .toBe(true)
    expect(premium.classList.contains('ui-checked')).toBe(false)

    fireEvent.tap(premium)
    expect(onValueChange.mock.calls).toEqual([['basic'], ['premium']])
  })

  it('does not reset uncontrolled selection when defaultValue changes', () => {
    const onValueChange = vi.fn()
    const { container, rerender } = render(
      createGroup({ defaultValue: 'basic', onValueChange }),
    )

    rerender(createGroup({ defaultValue: 'premium', onValueChange }))

    expect(onValueChange).not.toHaveBeenCalled()
    expect(container.querySelector('.basic')!.classList.contains('ui-checked'))
      .toBe(true)
  })

  it('renders parent value updates without echoing callbacks', () => {
    const onValueChange = vi.fn()
    const { container, rerender } = render(
      createGroup({ value: 'premium', onValueChange }),
    )

    rerender(createGroup({ value: 'basic', onValueChange }))

    expect(onValueChange).not.toHaveBeenCalled()
    expect(container.querySelector('.basic')!.classList.contains('ui-checked'))
      .toBe(true)
    expect(
      container.querySelector('.basic-indicator')!.classList.contains(
        'ui-checked',
      ),
    )
      .toBe(true)
    expect(
      container.querySelector('.premium')!.classList.contains('ui-checked'),
    )
      .toBe(false)
  })

  it('allows repeated controlled requests that the parent declines', () => {
    const onValueChange = vi.fn()
    const { container } = render(
      createGroup({ value: 'premium', onValueChange }),
    )

    fireEvent.tap(container.querySelector('.basic')!)
    fireEvent.tap(container.querySelector('.basic')!)
    fireEvent.tap(container.querySelector('.premium')!)

    expect(onValueChange.mock.calls).toEqual([['basic'], ['basic']])
    expect(
      container.querySelector('.premium')!.classList.contains('ui-checked'),
    )
      .toBe(true)
    expect(container.querySelector('.basic')!.classList.contains('ui-checked'))
      .toBe(false)
  })

  it('does not notify again when the parent accepts a controlled request', () => {
    const onValueChange = vi.fn()
    const { container, rerender } = render(
      createGroup({ value: 'premium', onValueChange }),
    )

    fireEvent.tap(container.querySelector('.basic')!)
    expect(onValueChange.mock.calls).toEqual([['basic']])
    rerender(createGroup({ value: 'basic', onValueChange }))
    fireEvent.tap(container.querySelector('.basic')!)
    expect(onValueChange.mock.calls).toEqual([['basic']])

    fireEvent.tap(container.querySelector('.premium')!)
    expect(onValueChange.mock.calls).toEqual([['basic'], ['premium']])
  })

  it('does not notify for disabled items or groups', () => {
    const onValueChange = vi.fn()
    const { container, rerender } = render(
      createGroup({ defaultValue: 'basic', onValueChange }),
    )

    fireEvent.tap(container.querySelector('.disabled')!)
    rerender(createGroup({ disabled: true, onValueChange }))
    fireEvent.tap(container.querySelector('.premium')!)

    expect(onValueChange).not.toHaveBeenCalled()
    expect(container.querySelector('.basic')!.classList.contains('ui-checked'))
      .toBe(true)
  })

  it('uses the latest callback and controlled value after rerender', () => {
    const initialCallback = vi.fn()
    const nextCallback = vi.fn()
    const { container, rerender } = render(
      createGroup({ value: 'basic', onValueChange: initialCallback }),
    )

    rerender(createGroup({ value: 'premium', onValueChange: nextCallback }))
    fireEvent.tap(container.querySelector('.basic')!)

    expect(initialCallback).not.toHaveBeenCalled()
    expect(nextCallback.mock.calls).toEqual([['basic']])
  })

  it('selects through label children without duplicate notifications', () => {
    const onValueChange = vi.fn()
    const { container, getByText } = render(
      createGroup({ defaultValue: 'premium', onValueChange }),
    )

    fireEvent.tap(getByText('Basic'))
    fireEvent.tap(getByText('Basic'))

    expect(onValueChange.mock.calls).toEqual([['basic']])
    expect(container.querySelector('.basic')!.classList.contains('ui-checked'))
      .toBe(true)
  })
})
