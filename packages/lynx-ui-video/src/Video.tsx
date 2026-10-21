// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// cspell:words videoengine bindplaying bindpaused bindstopped bindended bindlooped bindtimeupdate

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from '@lynx-js/react'
import type { ForwardedRef } from '@lynx-js/react'

import type { NodesRef } from '@lynx-js/types'
import { clsx } from 'clsx'

import { createVideoController, getVideoError } from './controller'
import type { Video as VideoComponent, VideoProps, VideoRef } from './types'
import './styles.css'

export const Video = forwardRef(VideoImpl) as VideoComponent

function VideoImpl(props: VideoProps, ref: ForwardedRef<VideoRef>) {
  const { playUrl, attached = true } = props
  const previousSource = useRef(playUrl)
  const playbackState = useRef<'stopped' | 'playing' | 'paused'>('stopped')
  useEffect(() => {
    const changed = previousSource.current !== playUrl
    previousSource.current = playUrl
    props.onSrcChanged?.()
    if (changed && attached && playbackState.current !== 'stopped') {
      playbackState.current = 'stopped'
      props.onStop?.()
    }
  }, [playUrl])
  useEffect(() => {
    if (!attached) playbackState.current = 'stopped'
  }, [attached])
  // A source owns its native element, callbacks, and poster lifecycle.
  return (
    <VideoSource
      key={`${attached}:${playUrl ?? ''}`}
      {...props}
      ref={ref}
      onPlay={() => {
        playbackState.current = 'playing'
        props.onPlay?.()
      }}
      onPause={() => {
        playbackState.current = 'paused'
        props.onPause?.()
      }}
      onStop={() => {
        playbackState.current = 'stopped'
        props.onStop?.()
      }}
    />
  )
}

const VideoSource = forwardRef(
  function VideoSource(props: VideoProps, ref: ForwardedRef<VideoRef>) {
    const {
      className,
      style,
      videoEngineId = 'videoengine',
      playUrl,
      poster,
      objectfit = 'aspectFit',
      mute = false,
      loop = false,
      playbackSpeed = 1,
      volume = 1,
      attached = true,
    } = props
    const nativeRef = useRef<NodesRef>(null)
    const latestProps = useRef(props)
    latestProps.current = props
    // VideoEngine applies native scaling when a source or player is created.
    const [sourceObjectFit] = useState(objectfit)
    const [posterVisible, setPosterVisible] = useState(true)
    const controller = useMemo(
      () =>
        createVideoController((method, position, callback) => {
          const node = nativeRef.current
          if (!node) {
            callback(false, -111, 'resource not prepared')
            return
          }
          node.invoke({
            method,
            params: position === undefined ? {} : { position },
            success(response: { success?: boolean }) {
              if (response?.success === false) {
                const error = getVideoError(response)
                callback(false, error.code, error.message)
              } else callback(true)
            },
            fail(response: unknown) {
              const error = getVideoError(response)
              callback(false, error.code, error.message)
            },
          }).exec()
        }, () =>
          latestProps.current, setPosterVisible),
      [],
    )

    useImperativeHandle(ref, () => controller.controls, [controller])
    useEffect(() => () => controller.dispose(), [controller])

    return (
      <view className={clsx('lynx-ui-video__root', className)} style={style}>
        {attached && (
          <video
            key={playUrl}
            ref={nativeRef}
            id={videoEngineId}
            className='lynx-ui-video__player'
            src={playUrl}
            muted={mute}
            loop={loop}
            speed={playbackSpeed}
            volume={volume}
            object-fit={sourceObjectFit === 'aspectFill'
              ? 'cover'
              : (sourceObjectFit === 'scaleToFill'
                ? 'fill'
                : 'contain')}
            mode='queue'
            bindfirstframe={event =>
              controller.firstFrame(event.detail.duration)}
            bindplaying={() => controller.playing()}
            bindpaused={() =>
              controller.paused()}
            bindstopped={() => controller.stopped()}
            bindended={() => controller.ended()}
            bindlooped={() => controller.looped()}
            bindtimeupdate={event =>
              controller.timeUpdate(
                event.detail.current,
                event.detail.duration,
              )}
            binderror={event => controller.error(event.detail)}
          />
        )}
        {poster && posterVisible && (
          <image
            className='lynx-ui-video__poster'
            src={poster}
            mode={objectfit}
          />
        )}
      </view>
    )
  },
)
