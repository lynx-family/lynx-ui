// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  Button,
  ToastContent,
  ToastPositioner,
  ToastRoot,
} from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  const [showToast, setShowToast] = useState<boolean>(false)
  const handleShowToast = () => {
    setShowToast(true)
  }

  return (
    <view className='demo-container lunaris-dark'>
      <Button
        className='toast-trigger'
        onClick={handleShowToast}
      >
        <text className='toast-trigger-text'>Show Toast</text>
      </Button>

      <ToastRoot
        show={showToast}
        onClose={() => {
          setShowToast(false)
          console.log('dismissed')
        }}
        onOpen={() => {
          setShowToast(true)
          console.log('showed')
        }}
      >
        <ToastPositioner className='toast-viewport lunaris-dark'>
          <ToastContent
            className='toast-item'
            duration={200}
            swipeDirection='top'
          >
            <text className='toast-message'>Toast is ready</text>
          </ToastContent>
        </ToastPositioner>
      </ToastRoot>
    </view>
  )
}

root.render(<App />)

export default App
