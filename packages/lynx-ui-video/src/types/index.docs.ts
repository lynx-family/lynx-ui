// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ForwardedRef, ReactElement } from '@lynx-js/react'

import type { CSSProperties } from '@lynx-js/types'

export type Video = (props: VideoProps) => ReactElement

/**
 * The result of submitting a playback operation. Listen to events for player state.
 * @Android
 * @iOS
 * @Harmony
 */
export type VideoPlaybackCallback = (
  success: boolean,
  errCode?: number,
  errMsg?: string,
) => void

/**
 * Playback controls shared with VideoEngine. All public times are milliseconds.
 * @Android
 * @iOS
 * @Harmony
 */
export interface VideoRef {
  /**
   * Start or resume playback.
   * @Android
   * @iOS
   * @Harmony
   */
  play: (callback?: VideoPlaybackCallback) => void
  /**
   * Pause playback at the current position.
   * @Android
   * @iOS
   * @Harmony
   */
  pause: (callback?: VideoPlaybackCallback) => void
  /**
   * Stop playback and return to the beginning.
   * @Android
   * @iOS
   * @Harmony
   */
  stop: (callback?: VideoPlaybackCallback) => void
  /**
   * Seek to a position in milliseconds, then play or remain paused.
   * @Android
   * @iOS
   * @Harmony
   */
  seek: (
    position: number,
    play: boolean,
    callback?: VideoPlaybackCallback,
  ) => void
  /**
   * Return to the first frame, then play or remain paused.
   * @Android
   * @iOS
   * @Harmony
   */
  replay: (play: boolean, callback?: VideoPlaybackCallback) => void
  /**
   * Read the duration in milliseconds after the source is prepared.
   * @Android
   * @iOS
   * @Harmony
   */
  getDuration: (
    callback?: (
      success: boolean,
      duration: number,
      errCode?: number,
      errMsg?: string,
    ) => void,
  ) => void
  /**
   * Show or hide the poster without changing playback.
   * @Android
   * @iOS
   * @Harmony
   */
  operatePoster: (display: boolean) => void
}

/**
 * A strict subset of VideoEngine, backed by the Lynx 4.1+ experimental video element.
 * Use an HTTP(S) source and give the wrapper explicit dimensions.
 */
export interface VideoProps {
  ref?: ForwardedRef<VideoRef>
  /**
   * Base class for the wrapper.
   * @Android
   * @iOS
   * @Harmony
   */
  className?: string
  /**
   * Wrapper dimensions and styling.
   * @Android
   * @iOS
   * @Harmony
   */
  style?: CSSProperties
  /**
   * Native element ID. Use a unique value when selecting the element externally.
   * @Android
   * @iOS
   * @Harmony
   */
  videoEngineId?: string
  /**
   * HTTP(S) video source. Changing it resets playback and the poster.
   * @Android
   * @iOS
   * @Harmony
   */
  playUrl?: string
  /**
   * Image displayed until the first video frame is rendered.
   * @Android
   * @iOS
   * @Harmony
   */
  poster?: string
  /**
   * Start playback after preparing each source.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   */
  autoPlay?: boolean
  /**
   * Video and poster scaling.
   * Video scaling applies when `playUrl` changes or the player mounts,
   * including reattaching with `attached`. Poster scaling updates immediately.
   * @defaultValue 'aspectFit'
   * @Android
   * @iOS
   * @Harmony
   */
  objectfit?: 'aspectFit' | 'aspectFill' | 'scaleToFill'
  /**
   * Mute audio.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   */
  mute?: boolean
  /**
   * Repeat playback.
   * @defaultValue false
   * @Android
   * @iOS
   * @Harmony
   */
  loop?: boolean
  /**
   * Playback rate from 0.1 to 2.
   * @defaultValue 1
   * @Android
   * @iOS
   * @Harmony
   */
  playbackSpeed?: number
  /**
   * Volume from 0 to 1.
   * @defaultValue 1
   * @Android
   * @iOS
   * @Harmony
   */
  volume?: number
  /**
   * Mount the player on demand. Detaching releases the native player.
   * @defaultValue true
   * @Android
   * @iOS
   * @Harmony
   */
  attached?: boolean
  /**
   * Playback started or resumed.
   * @eventProperty
   * @Android
   * @iOS
   * @Harmony
   */
  onPlay?: () => void
  /**
   * Playback paused.
   * @eventProperty
   * @Android
   * @iOS
   * @Harmony
   */
  onPause?: () => void
  /**
   * Playback stopped.
   * @eventProperty
   * @Android
   * @iOS
   * @Harmony
   */
  onStop?: () => void
  /**
   * A seek completed with the requested playback state.
   * @eventProperty
   * @Android
   * @iOS
   * @Harmony
   */
  onSeek?: (willPlay: boolean) => void
  /**
   * Playback reached the end, including each loop iteration.
   * @eventProperty
   * @Android
   * @iOS
   * @Harmony
   */
  onEnded?: () => void
  /**
   * The source changed, including the initial mount.
   * @eventProperty
   * @Android
   * @iOS
   * @Harmony
   */
  onSrcChanged?: () => void
  /**
   * A native playback error occurred. Error codes are platform-specific.
   * @eventProperty
   * @Android
   * @iOS
   * @Harmony
   */
  onError?: (e: { errorCode: number, errorMsg: string }) => void
  /**
   * Current position and total duration, both in milliseconds.
   * @eventProperty
   * @Android
   * @iOS
   * @Harmony
   */
  onTimeUpdate?: (e: { detail: { current: number, total: number } }) => void
  /**
   * The first frame rendered for the current source.
   * @eventProperty
   * @Android
   * @iOS
   * @Harmony
   */
  onFirstFrame?: () => void
  /**
   * The source is ready for playback.
   * @eventProperty
   * @Android
   * @iOS
   * @Harmony
   */
  onPrepared?: () => void
}
