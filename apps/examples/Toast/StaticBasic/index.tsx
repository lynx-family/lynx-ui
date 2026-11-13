// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  Button,
  ToastContent,
  ToastMountPoint,
  ToastPositioner,
  toast,
} from '@lynx-js/lynx-ui'
import type { StaticToastConfig } from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  const toastConfig: StaticToastConfig = {
    root: {
      onClose: () => {
        console.info(
          'Toast Close.',
        )
      },
      onOpen: () => {
        console.info(
          'Toast Open.',
        )
      },
      children: (
        <ToastPositioner className='toast-viewport lunaris-dark'>
          <ToastContent className='toast-item'>
            <text className='toast-message'>Toast opened imperatively</text>
          </ToastContent>
        </ToastPositioner>
      ),
    },
    duration: 3000,
  }
  const handleShowToast = () => {
    toast.open(toastConfig)
  }

  return (
    <view className='demo-container lunaris-dark'>
      <Button
        className='toast-trigger'
        onClick={handleShowToast}
      >
        <text className='toast-trigger-text'>Show Toast</text>
      </Button>
      <ToastMountPoint />
    </view>
  )
}

root.render(<App />)

export default App
