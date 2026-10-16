// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// cspell:words firstframe

import { root, useRef, useState } from '@lynx-js/react'

import { Button, Video } from '@lynx-js/lynx-ui'
import type { VideoRef } from '@lynx-js/lynx-ui'

import './index.css'

const sources = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
]

function App() {
  const video = useRef<VideoRef>(null)
  const [source, setSource] = useState(0)
  const [status, setStatus] = useState('Preparing')
  const [current, setCurrent] = useState(0)
  const [total, setTotal] = useState(0)
  const [muted, setMuted] = useState(true)
  const [loop, setLoop] = useState(false)

  const report = (event: string, detail?: unknown) => {
    console.log(
      '[Video]',
      event,
      detail === undefined ? '' : JSON.stringify(detail),
    )
  }
  const callback =
    (action: string) => (success: boolean, code?: number, message?: string) => {
      report(action, { success, code, message })
      if (!success) setStatus(message ?? `${action} failed`)
    }

  return (
    <view className='demo-container lunaris-dark luna-gradient-berry'>
      <view className='player-card'>
        <Video
          ref={video}
          videoEngineId='video-example'
          className='video'
          style={{ width: '100%', height: '220px' }}
          playUrl={sources[source]}
          mute={muted}
          loop={loop}
          onPrepared={() => {
            setStatus('Ready')
            report('prepared')
            video.current?.getDuration((success, duration) => {
              report('duration', { success, duration })
              if (success) setTotal(duration)
            })
          }}
          onFirstFrame={() => report('firstframe')}
          onPlay={() => {
            setStatus('Playing')
            report('play')
          }}
          onPause={() => {
            setStatus('Paused')
            report('pause')
          }}
          onStop={() => {
            setStatus('Stopped')
            setCurrent(0)
            report('stop')
          }}
          onSeek={willPlay => report('seek', { willPlay })}
          onEnded={() => {
            setStatus(loop ? 'Playing' : 'Ended')
            report('ended')
          }}
          onSrcChanged={() => {
            setCurrent(0)
            setTotal(0)
            report('source')
          }}
          onTimeUpdate={event => {
            setCurrent(event.detail.current)
            setTotal(event.detail.total)
            report('time', event.detail)
          }}
          onError={error => {
            setStatus(error.errorMsg)
            report('error', error)
          }}
        />
        <view className='timeline'>
          <text className='status'>{status}</text>
          <text className='time'>
            {(current / 1000).toFixed(1)} / {(total / 1000).toFixed(1)} s
          </text>
        </view>
        <view className='controls'>
          <Button
            className='action primary'
            onClick={() => video.current?.play(callback('play-result'))}
          >
            <text className='action-label'>Play</text>
          </Button>
          <Button
            className='action'
            onClick={() => video.current?.pause(callback('pause-result'))}
          >
            <text className='action-label'>Pause</text>
          </Button>
          <Button
            className='action'
            onClick={() => video.current?.stop(callback('stop-result'))}
          >
            <text className='action-label'>Stop</text>
          </Button>
          <Button
            className='action'
            onClick={() =>
              video.current?.seek(2000, false, callback('seek-result'))}
          >
            <text className='action-label'>Seek 2s</text>
          </Button>
          <Button
            className='action'
            onClick={() =>
              video.current?.replay(true, callback('replay-result'))}
          >
            <text className='action-label'>Replay</text>
          </Button>
          <Button
            className='action'
            onClick={() => setSource(value => (value + 1) % sources.length)}
          >
            <text className='action-label'>Next video</text>
          </Button>
        </view>
        <view className='controls settings'>
          <Button className='action' onClick={() => setMuted(value => !value)}>
            <text className='action-label'>{muted ? 'Unmute' : 'Mute'}</text>
          </Button>
          <Button className='action' onClick={() => setLoop(value => !value)}>
            <text className='action-label'>Loop {loop ? 'on' : 'off'}</text>
          </Button>
        </view>
      </view>
    </view>
  )
}

root.render(<App />)
export default App
