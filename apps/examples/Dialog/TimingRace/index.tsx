// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useEffect, useRef, useState } from '@lynx-js/react'

import './index.css'

import {
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTrigger,
  DialogView,
} from '@lynx-js/lynx-ui'

const REOPEN_DELAY = 200

function App() {
  const [show, setShow] = useState(false)
  const [pageTaps, setPageTaps] = useState(0)
  const [events, setEvents] = useState<string[]>(['Ready'])
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const eventCountRef = useRef(0)

  const pushEvent = (message: string) => {
    eventCountRef.current += 1
    setEvents(prev =>
      [
        `${eventCountRef.current}. ${message}`,
        ...prev,
      ].slice(0, 8)
    )
  }

  const clearTimers = () => {
    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current = []
  }

  const schedule = (delay: number, callback: () => void) => {
    const timer = setTimeout(() => {
      timersRef.current = timersRef.current.filter(item => item !== timer)
      callback()
    }, delay)
    timersRef.current.push(timer)
  }

  const requestShow = (nextShow: boolean, source: string) => {
    pushEvent(`${source}: show=${String(nextShow)}`)
    setShow(nextShow)
  }

  const handleShowChange = (nextShow: boolean) => {
    pushEvent(`onShowChange: show=${String(nextShow)}`)
    setShow(nextShow)
  }

  const runCloseReopen = () => {
    clearTimers()
    requestShow(false, 'close')
    schedule(REOPEN_DELAY, () => requestShow(true, 'reopen after 200ms'))
  }

  const runOverlayProbe = () => {
    clearTimers()
    pushEvent('overlay probe started')
    setPageTaps(0)
    requestShow(true, 'probe open')
    schedule(120, () => requestShow(false, 'probe close before enter'))
    schedule(320, () => requestShow(true, 'probe reopen'))
    schedule(430, () => requestShow(false, 'probe final close'))
    schedule(760, () => pushEvent('tap page probe now'))
  }

  const handlePageProbe = () => {
    setPageTaps(count => count + 1)
    pushEvent('page probe tapped')
  }

  useEffect(() => clearTimers, [])

  return (
    <view className='demo-container lunaris-dark'>
      <view className='toolbar'>
        <DialogRoot
          onClose={() => pushEvent('onClose')}
          onOpen={() => pushEvent('onOpen')}
          show={show}
          onShowChange={handleShowChange}
        >
          <DialogTrigger className='demo-button'>
            <text className='demo-button-text'>Open</text>
          </DialogTrigger>

          <DialogView className='dialog-viewport'>
            <DialogBackdrop className='dialog-backdrop' />

            <DialogContent className='dialog-content'>
              <view className='dialog-body'>
                <text className='dialog-title'>Dialog timing probes</text>
                <text className='dialog-desc'>
                  Use these actions to interrupt enter and exit transitions.
                </text>
              </view>

              <view className='dialog-actions'>
                <view className='dialog-action' bindtap={runCloseReopen}>
                  <text className='dialog-action-text'>
                    Option: reopen 200ms
                  </text>
                </view>
                <DialogClose className='dialog-action dialog-action-muted'>
                  <text className='dialog-action-text'>Close</text>
                </DialogClose>
              </view>
            </DialogContent>
          </DialogView>
        </DialogRoot>

        <view className='demo-button' bindtap={runCloseReopen}>
          <text className='demo-button-text'>Close/reopen</text>
        </view>

        <view className='demo-button' bindtap={runOverlayProbe}>
          <text className='demo-button-text'>Overlay probe</text>
        </view>

        <view className='probe-button' bindtap={handlePageProbe}>
          <text className='probe-button-text'>Page taps: {pageTaps}</text>
        </view>
      </view>

      <view className='event-log'>
        {events.map(event => (
          <text className='event-text' key={event}>{event}</text>
        ))}
      </view>
    </view>
  )
}

root.render(<App />)

export default App
