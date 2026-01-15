// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { CheckboxIndicator } from '@lynx-js/lynx-ui-checkbox'
import { FormField, FormRoot, FormSubmitButton } from '@lynx-js/lynx-ui-form'
import { Radio, RadioIndicator } from '@lynx-js/lynx-ui-radio-group'
import { ScrollView } from '@lynx-js/lynx-ui-scroll-view'

import { formPageData } from './data'

import './index.css'

function App() {
  const [formValues, setFormValues] = useState<Record<string, unknown>>({})

  return (
    <view className='page lunaris-dark'>
      <ScrollView scrollOrientation='vertical' className='scroll'>
        <FormRoot
          onChanged={(values: Record<string, unknown>) => setFormValues(values)}
          initialValues={{
            gender: '',
            firstName: 'San',
            lastName: 'Hamburger',
          }}
        >
          <view className='form-container'>
            <text className='form-title'>{formPageData.title}</text>
            <text className='form-subtitle'>{formPageData.subtitle}</text>

            <view className='divider' />

            <text className='form-section-title'>Gender</text>
            <FormField as='RadioGroupRoot' name='gender'>
              <view className='radio-group-container'>
                {formPageData.genderOptions.map(({ label, value }) => (
                  <Radio className='radio-item' key={value} value={value}>
                    <RadioIndicator className='radio-indicator'>
                      <view className='radio-indicator-checked-item' />
                    </RadioIndicator>
                    <text className='radio-label'>{label}</text>
                  </Radio>
                ))}
              </view>
            </FormField>

            <view className='divider' />

            <text className='form-section-title'>First name</text>
            <text className='form-field-description'>
              If you have a middle name, you can enter it here.
            </text>
            <view className='input-container'>
              <FormField as='Input' name='firstName' className='form-input' />
            </view>

            <text className='form-section-title'>Last name</text>
            <view className='input-container'>
              <FormField as='Input' name='lastName' className='form-input' />
            </view>

            <view className='divider' />

            <FormField as='Checkbox' name='agreement' className='checkbox-item'>
              <CheckboxIndicator className='checkbox-indicator'>
                <view className='checkbox-indicator-checked-item' />
              </CheckboxIndicator>
              <text className='checkbox-label'>
                I agree to the terms and conditions
              </text>
            </FormField>

            <FormSubmitButton
              onSubmit={(e) => console.info(e)}
              className='submit-button'
            >
              <text className='submit-button-text'>Submit</text>
            </FormSubmitButton>

            <view className='divider' />

            <text className='form-section-title'>onChanged Content</text>
            <text className='form-values-display'>
              {JSON.stringify(formValues, null, 2)}
            </text>
          </view>
        </FormRoot>
      </ScrollView>
    </view>
  )
}
root.render(<App />)

export default App
