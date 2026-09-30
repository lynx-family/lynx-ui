// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  InputOTP,
  InputOTPSlot,
  KeyboardAwareResponder,
  KeyboardAwareRoot,
  KeyboardAwareTrigger,
} from '@lynx-js/lynx-ui'
import type {
  InputOTPLength,
  InputOTPRenderProps,
  InputOTPSlotRenderProps,
} from '@lynx-js/lynx-ui'

import { INPUT_TYPE_FIXTURES } from './data'
import type { InputTypeFixture } from './data'
import './index.css'

interface SlotSetProps {
  length: InputOTPLength
  masked?: boolean
}

function SlotSet({ length, masked = false }: SlotSetProps) {
  return Array.from({ length }, (_, index) => (
    <InputOTPSlot
      key={index}
      className='otp-slot'
      index={index}
    >
      {masked
        ? ({ filled }) =>
          filled
            ? <text className='slot-character'>•</text>
            : null
        : undefined}
    </InputOTPSlot>
  ))
}

function renderOTPSlot({
  index,
  char,
  focused,
  filled,
}: InputOTPSlotRenderProps) {
  if (filled) {
    return <text className='slot-character'>{char}</text>
  }

  if (focused) {
    return <view className='caret' />
  }

  return <text className='slot-placeholder'>{index + 1}</text>
}

function renderOTPField({
  value,
  length,
  inputType,
  focused,
  complete,
}: InputOTPRenderProps) {
  return (
    <>
      <view className='otp-field slot-row'>
        {Array.from({ length }, (_, index) => (
          <InputOTPSlot
            key={index}
            className='otp-slot'
            index={index}
          >
            {renderOTPSlot}
          </InputOTPSlot>
        ))}
      </view>
      <text className='render-meta'>
        {`${value.length}/${length} · ${inputType} · ${
          focused ? 'focused' : 'blurred'
        } · ${complete ? 'complete' : 'incomplete'}`}
      </text>
    </>
  )
}

function TypeRow({
  defaultValue,
  inputType,
  label,
}: InputTypeFixture) {
  return (
    <view className='type-row'>
      <text className='row-label'>{label}</text>
      <InputOTP
        className='otp-field compact'
        defaultValue={defaultValue}
        inputType={inputType}
        length={4}
      >
        <SlotSet length={4} />
      </InputOTP>
    </view>
  )
}

function App() {
  const [value, setValue] = useState('65')
  const [completeValue, setCompleteValue] = useState('')
  const [keyboardValue, setKeyboardValue] = useState('')

  return (
    <view className='demo-container lunaris-dark'>
      <KeyboardAwareRoot androidStatusBarPlusBottomBarHeight={74}>
        <KeyboardAwareResponder
          as='ScrollView'
          className='scroll'
          scrollviewId='input-otp-capabilities'
        >
          <view className='content'>
            <text className='page-title'>InputOTP capabilities</text>
            <text className='page-description'>
              Headless composition for verification codes and PINs.
            </text>

            <KeyboardAwareTrigger offset={0}>
              <view className='section'>
                <view className='section-heading'>
                  <text className='section-title'>
                    Controlled numeric value
                  </text>
                  <text className='section-meta'>
                    {completeValue
                      ? `Complete: ${completeValue}`
                      : `Value: ${value}`}
                  </text>
                </view>
                <InputOTP
                  className='otp-field'
                  inputType='numeric'
                  length={6}
                  value={value}
                  onChange={(nextValue) => {
                    setValue(nextValue)
                    setCompleteValue('')
                  }}
                  onComplete={setCompleteValue}
                >
                  <SlotSet length={6} />
                </InputOTP>
              </view>
            </KeyboardAwareTrigger>

            <KeyboardAwareTrigger offset={0}>
              <view className='section'>
                <text className='section-title'>Accepted character sets</text>
                {INPUT_TYPE_FIXTURES.map((fixture) => (
                  <TypeRow key={fixture.inputType} {...fixture} />
                ))}
              </view>
            </KeyboardAwareTrigger>

            <KeyboardAwareTrigger offset={0}>
              <view className='section'>
                <text className='section-title'>
                  Field and slot render props
                </text>
                <InputOTP
                  className='render-field'
                  defaultValue='A1'
                  inputType='alphanumeric'
                  length={5}
                >
                  {renderOTPField}
                </InputOTP>
              </view>
            </KeyboardAwareTrigger>

            <KeyboardAwareTrigger offset={0}>
              <view className='section'>
                <text className='section-title'>
                  Disabled and invalid states
                </text>
                <view className='state-grid'>
                  <view className='state-column'>
                    <text className='row-label'>Disabled</text>
                    <InputOTP
                      disabled
                      className='otp-field compact'
                      defaultValue='6514'
                      length={4}
                    >
                      <SlotSet length={4} />
                    </InputOTP>
                  </view>
                  <view className='state-column'>
                    <text className='row-label error-text'>Invalid</text>
                    <InputOTP
                      invalid
                      className='otp-field compact'
                      defaultValue='6174'
                      length={4}
                    >
                      <SlotSet length={4} />
                    </InputOTP>
                  </view>
                </view>
              </view>
            </KeyboardAwareTrigger>

            <KeyboardAwareTrigger offset={0}>
              <view className='section'>
                <text className='section-title'>Masking and separators</text>
                <view className='type-row'>
                  <text className='row-label'>Masked</text>
                  <InputOTP
                    className='otp-field compact'
                    defaultValue='6514'
                    length={4}
                  >
                    <SlotSet length={4} masked />
                  </InputOTP>
                </view>
                <view className='type-row'>
                  <text className='row-label'>Grouped</text>
                  <InputOTP
                    className='otp-field grouped'
                    defaultValue='651468'
                    length={6}
                  >
                    <InputOTPSlot
                      className='otp-slot'
                      index={0}
                    />
                    <InputOTPSlot
                      className='otp-slot'
                      index={1}
                    />
                    <text className='separator'>-</text>
                    <InputOTPSlot
                      className='otp-slot'
                      index={2}
                    />
                    <InputOTPSlot
                      className='otp-slot'
                      index={3}
                    />
                    <text className='separator'>-</text>
                    <InputOTPSlot
                      className='otp-slot'
                      index={4}
                    />
                    <InputOTPSlot
                      className='otp-slot'
                      index={5}
                    />
                  </InputOTP>
                </view>
              </view>
            </KeyboardAwareTrigger>

            <KeyboardAwareTrigger offset={0}>
              <view className='section'>
                <view className='section-heading'>
                  <text className='section-title'>
                    Keyboard avoidance in ScrollView
                  </text>
                  <text className='section-meta'>
                    {`${6 - keyboardValue.length} remaining`}
                  </text>
                </view>
                <InputOTP
                  className='otp-field'
                  inputType='numeric'
                  length={6}
                  value={keyboardValue}
                  onChange={setKeyboardValue}
                >
                  <SlotSet length={6} />
                </InputOTP>
              </view>
            </KeyboardAwareTrigger>
          </view>
        </KeyboardAwareResponder>
      </KeyboardAwareRoot>
    </view>
  )
}

root.render(<App />)

export default App
