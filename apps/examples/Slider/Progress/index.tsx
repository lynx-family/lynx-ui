// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useRef, useState } from '@lynx-js/react'

import { SliderIndicator, SliderRoot, SliderTrack } from '@lynx-js/lynx-ui'

import './index.css'

function formatValue(value: number) {
  return `${Math.round(value * 100)}%`
}

function App() {
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const downloadTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const uploadTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    downloadTimer.current = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 1) return 0
        return Math.min(prev + 0.02, 1)
      })
    }, 80)

    uploadTimer.current = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 1) return 0
        return Math.min(prev + 0.01, 1)
      })
    }, 100)

    return () => {
      if (downloadTimer.current) clearInterval(downloadTimer.current)
      if (uploadTimer.current) clearInterval(uploadTimer.current)
    }
  }, [])

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='demo-canvas'>
        <view className='section'>
          <text className='title'>Progress (No Thumb)</text>
          <text className='desc'>
            SliderRoot + SliderIndicator without SliderThumb, used as a
            read-only progress indicator.
          </text>

          <view className='progress-row'>
            <view className='progress-meta'>
              <text className='progress-label'>Downloading...</text>
              <text className='progress-value'>
                {formatValue(downloadProgress)}
              </text>
            </view>
            <SliderRoot
              className='progress-root'
              value={downloadProgress}
              disabled
            >
              <SliderTrack className='progress-track'>
                <SliderIndicator className='progress-indicator' />
              </SliderTrack>
            </SliderRoot>
          </view>

          <view className='progress-row'>
            <view className='progress-meta'>
              <text className='progress-label'>Uploading...</text>
              <text className='progress-value'>
                {formatValue(uploadProgress)}
              </text>
            </view>
            <SliderRoot
              className='progress-root'
              value={uploadProgress}
              disabled
            >
              <SliderTrack className='progress-track'>
                <SliderIndicator className='progress-indicator progress-indicator-secondary' />
              </SliderTrack>
            </SliderRoot>
          </view>
        </view>

        <view className='section'>
          <text className='title'>Static Progress</text>
          <text className='desc'>
            Fixed progress values showing various completion states.
          </text>

          <view className='progress-row'>
            {[0.25, 0.5, 0.75, 1].map((v) => (
              <view key={`static-${v}`} className='static-row'>
                <text className='static-label'>{formatValue(v)}</text>
                <view className='static-bar-wrapper'>
                  <SliderRoot
                    className='progress-root'
                    value={v}
                    disabled
                  >
                    <SliderTrack className='progress-track'>
                      <SliderIndicator className='progress-indicator' />
                    </SliderTrack>
                  </SliderRoot>
                </view>
              </view>
            ))}
          </view>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)

export default App
