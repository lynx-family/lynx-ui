// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import { useLunaColor } from '@lynx-js/luna-reactlynx'
import {
  Button,
  Column,
  Row,
  Switch,
  Theme,
} from '@lynx-js/lynx-ui-receipe-luna'

import './index.css'

function ThemeSwatch() {
  const color = useLunaColor({ format: 'value' })
  return (
    <view
      className='preview-swatch'
      style={{ backgroundColor: color('primary') }}
    />
  )
}

function App() {
  const [darkPreview, setDarkPreview] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const [savedNotifications, setSavedNotifications] = useState(false)

  return (
    <Theme themeKey='lunaris-dark' className='demo-container'>
      <Column gap='4' className='stage'>
        <Row align='center' justify='between' gap='2'>
          <text className='preview-label'>Appearance preview</text>
          <Button
            variant='soft'
            onClick={() => setDarkPreview(!darkPreview)}
          >
            {darkPreview ? 'Use light' : 'Use dark'}
          </Button>
        </Row>

        <Theme
          themeKey={darkPreview ? 'lunaris-dark' : 'lunaris-light'}
          className='panel'
        >
          <Column p='5' gap='4'>
            <Row align='center' gap='2'>
              <ThemeSwatch />
              <text className='title'>Notifications</text>
            </Row>
            <Row align='center' justify='between' gap='3'>
              <text className='label'>Product updates</text>
              <Switch
                accessibility-label='Product updates'
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </Row>
            <Row justify='end'>
              <Button
                disabled={savedNotifications === notifications}
                onClick={() => setSavedNotifications(notifications)}
              >
                Save changes
              </Button>
            </Row>
          </Column>
        </Theme>
      </Column>
    </Theme>
  )
}

root.render(<App />)
export default App
