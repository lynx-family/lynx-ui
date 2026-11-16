// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  Column,
  LunaButton,
  LunaSwitch,
  LunaThemeScope,
  Row,
} from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  const [darkPreview, setDarkPreview] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const [savedNotifications, setSavedNotifications] = useState(false)

  return (
    <LunaThemeScope themeKey='lunaris-dark' className='demo-container'>
      <Column gap='4' className='stage'>
        <Row align='center' justify='between' gap='2'>
          <text className='preview-label'>Appearance preview</text>
          <LunaButton
            variant='soft'
            onClick={() => setDarkPreview(!darkPreview)}
          >
            {darkPreview ? 'Use light' : 'Use dark'}
          </LunaButton>
        </Row>

        <LunaThemeScope
          themeKey={darkPreview ? 'lunaris-dark' : 'lunaris-light'}
          className='panel'
        >
          <Column p='5' gap='4'>
            <text className='title'>Notifications</text>
            <Row align='center' justify='between' gap='3'>
              <text className='label'>Product updates</text>
              <LunaSwitch
                label='Product updates'
                checked={notifications}
                onChange={setNotifications}
              />
            </Row>
            <Row justify='end'>
              <LunaButton
                disabled={savedNotifications === notifications}
                onClick={() => setSavedNotifications(notifications)}
              >
                Save changes
              </LunaButton>
            </Row>
          </Column>
        </LunaThemeScope>
      </Column>
    </LunaThemeScope>
  )
}

root.render(<App />)
export default App
