// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { act, createEvent, render } from '@lynx-js/react/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Input, TextArea } from '../src'

const invoke = vi.fn(
  (options: unknown) => {
    const command = options as { success?: (result: unknown) => void }
    return { exec: () => command.success?.({}) }
  },
)

beforeEach(() => {
  invoke.mockClear()
  lynxTestingEnv.switchToBackgroundThread()
  const createSelectorQuery = lynx.createSelectorQuery
  const query = createSelectorQuery()
  const inputRef = (
    // @ts-expect-error The testing environment implements this Lynx API.
    query.selectUniqueID(0)
  )
  vi.spyOn(inputRef, 'invoke').mockImplementation(invoke)
  vi.spyOn(lynx, 'createSelectorQuery').mockImplementation(() => ({
    ...createSelectorQuery(),
    select: () => inputRef,
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
})

function dispatchFieldEvent(field: Element, name: 'focus' | 'blur') {
  const event = createEvent(`bindEvent:${name}`, field)
  Object.assign(event, {
    eventType: 'bindEvent',
    eventName: name,
    detail: { value: '' },
  })
  act(() => {
    field.dispatchEvent(event)
  })
}

const components = [
  {
    name: 'Input',
    renderComponent: (readonly = false) => (
      <Input className='consumer-class' readonly={readonly} value='' />
    ),
  },
  {
    name: 'TextArea',
    renderComponent: (readonly = false) => (
      <TextArea className='consumer-class' readonly={readonly} value='' />
    ),
  },
]

function renderField(renderComponent: (readonly?: boolean) => JSX.Element) {
  return render(renderComponent(), { enableMainThread: true })
}

describe.each(components)('$name UI variants', ({
  renderComponent,
}) => {
  it('preserves the consumer className', () => {
    const { container } = renderField(renderComponent)
    const field = container.querySelector('.consumer-class')!

    expect(field.classList.contains('consumer-class')).toBe(true)
  })

  it('toggles ui-focused on native focus and blur events', () => {
    const { container } = renderField(renderComponent)
    const field = container.querySelector('.consumer-class')!

    expect(field.classList.contains('ui-focused')).toBe(false)
    dispatchFieldEvent(field, 'focus')
    expect(field.classList.contains('ui-focused')).toBe(true)
    dispatchFieldEvent(field, 'blur')
    expect(field.classList.contains('ui-focused')).toBe(false)
  })

  it('follows readonly prop changes with ui-readonly', () => {
    const { container, rerender } = renderField(renderComponent)
    const field = container.querySelector('.consumer-class')!

    expect(field.classList.contains('ui-readonly')).toBe(false)
    rerender(renderComponent(true))
    expect(field.classList.contains('ui-readonly')).toBe(true)
    rerender(renderComponent(false))
    expect(field.classList.contains('ui-readonly')).toBe(false)
  })
})
