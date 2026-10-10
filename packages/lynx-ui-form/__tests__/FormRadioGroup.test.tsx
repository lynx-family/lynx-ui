// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { render } from '@lynx-js/react/testing-library'
import { describe, expect, it, vi } from 'vitest'

import { FormField, FormRoot } from '../src'
import { useForm } from '../src/Form'

describe('FormField RadioGroupRoot', () => {
  it('preserves the initial value without field or form notifications', () => {
    const onChanged = vi.fn()
    const onFieldChanged = vi.fn()
    const observedValues: Record<string, unknown>[] = []
    function FormValue() {
      observedValues.push(useForm().formData)
      return null
    }

    render(
      <FormRoot initialValues={{ plan: 'basic' }} onChanged={onChanged}>
        <FormField as='RadioGroupRoot' name='plan' onChanged={onFieldChanged} />
        <FormValue />
      </FormRoot>,
    )

    expect(observedValues).not.toHaveLength(0)
    expect(observedValues[observedValues.length - 1]).toEqual({ plan: 'basic' })
    expect(onChanged).not.toHaveBeenCalled()
    expect(onFieldChanged).not.toHaveBeenCalled()
  })
})
