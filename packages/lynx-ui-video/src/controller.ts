// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { VideoPlaybackCallback, VideoProps, VideoRef } from './types'

type NativeMethod = 'play' | 'pause' | 'stop' | 'seek'
export type VideoInvoker = (
  method: NativeMethod,
  position: number | undefined,
  callback: VideoPlaybackCallback,
) => void

// Normalize both SelectorQuery failures and player-level response objects.
export function getVideoError(
  response: unknown,
): { code: number, message: string } {
  if (typeof response !== 'object' || response === null) {
    return {
      code: -1,
      message: typeof response === 'string'
        ? response
        : 'Video operation failed',
    }
  }
  const record = response as Record<string, unknown>
  const data = typeof record.data === 'object' && record.data !== null
    ? record.data as Record<string, unknown>
    : record
  const code = data.errorCode ?? record.code
  const message = data.errorMsg ?? data.msg ?? record.data
  return {
    code: typeof code === 'number' ? code : -1,
    message: typeof message === 'string' ? message : 'Video operation failed',
  }
}

// Own one source's operations so late callbacks cannot control its replacement.
export function createVideoController(
  invoke: VideoInvoker,
  getProps: () => VideoProps,
  setPoster: (visible: boolean) => void,
) {
  let disposed = false
  let prepared = false
  let duration = 0
  let stopped = false
  let reportedPlaybackState: 'stopped' | 'playing' | 'paused' = 'stopped'
  let failure: { errorCode: number, errorMsg: string } | undefined
  interface Operation {
    execute: (operation: Operation) => void
    callback?: VideoPlaybackCallback
    settled: boolean
  }
  let active: Operation | undefined
  let pending: Operation | undefined
  let restoringPlayback: Operation | undefined
  let notifying = 0
  const durationCallbacks: NonNullable<
    Parameters<VideoRef['getDuration']>[0]
  >[] = []

  const available = () =>
    !disposed && getProps().attached !== false && !!getProps().playUrl
  const drain = () => {
    if (!available() || !prepared || active || notifying || !pending) return
    active = pending
    pending = undefined
    active.execute(active)
  }
  const notify = (callback: () => void) => {
    notifying++
    try {
      callback()
    } finally {
      notifying--
      drain()
    }
  }
  const finish = (
    operation: Operation,
    success: boolean,
    code?: number,
    message?: string,
  ) => {
    if (operation.settled) return
    operation.settled = true
    if (restoringPlayback === operation) restoringPlayback = undefined
    if (active === operation) active = undefined
    if (pending === operation) pending = undefined
    notify(() => operation.callback?.(success, code, message))
  }
  const run = (
    execute: Operation['execute'],
    callback?: VideoPlaybackCallback,
  ) => {
    if (available()) {
      if (failure) {
        callback?.(false, failure.errorCode, failure.errorMsg)
        return
      }
      const previous = pending
      pending = { execute, callback, settled: false }
      if (previous) finish(previous, false, -222, 'operation superseded')
      drain()
    } else {
      callback?.(false, -111, 'resource not prepared')
    }
  }
  const call = (
    operation: Operation,
    method: NativeMethod,
    position: number | undefined,
    callback: VideoPlaybackCallback,
  ) => {
    if (disposed || active !== operation || operation.settled) return
    let completed = false
    invoke(method, position, (success, code, message) => {
      if (completed || disposed || active !== operation || operation.settled) {
        return
      }
      completed = true
      callback(success, code, message)
    })
  }

  const seek = (
    position: number,
    willPlay: boolean,
    callback?: VideoPlaybackCallback,
  ) => {
    if (!Number.isFinite(position) || position < 0) {
      callback?.(false, -1, 'position must be a non-negative finite number')
      return
    }
    run(operation => {
      const complete: VideoPlaybackCallback = (success, code, message) => {
        if (success) getProps().onSeek?.(willPlay)
        finish(operation, success, code, message)
      }
      const seekPreparedSource = () => {
        call(operation, 'pause', undefined, (paused, code, message) => {
          if (!paused) {
            finish(operation, false, code, message)
            return
          }
          call(
            operation,
            'seek',
            position / 1000,
            (sought, seekCode, seekMessage) => {
              if (!sought) {
                finish(operation, false, seekCode, seekMessage)
                return
              }
              restoringPlayback = undefined
              if (willPlay) call(operation, 'play', undefined, complete)
              else complete(true)
            },
          )
        })
      }
      // Android stop clears its MediaItem. Play rebuilds it before a subsequent seek.
      if (stopped) {
        restoringPlayback = operation
        call(operation, 'play', undefined, (success, code, message) => {
          if (success) {
            stopped = false
            seekPreparedSource()
          } else finish(operation, false, code, message)
        })
      } else seekPreparedSource()
    }, callback)
  }

  const playback = (
    method: 'play' | 'pause' | 'stop',
    callback?: VideoPlaybackCallback,
  ) => {
    run(
      operation =>
        call(operation, method, undefined, (success, code, message) => {
          if (success && method !== 'pause') stopped = method === 'stop'
          finish(operation, success, code, message)
        }),
      callback,
    )
  }

  const replay = (willPlay: boolean, callback?: VideoPlaybackCallback) => {
    run(operation => {
      call(
        operation,
        'stop',
        undefined,
        (stoppedSuccessfully, code, message) => {
          if (!stoppedSuccessfully) {
            finish(operation, false, code, message)
            return
          }
          stopped = true
          call(
            operation,
            'play',
            undefined,
            (played, playCode, playMessage) => {
              if (!played) {
                finish(operation, false, playCode, playMessage)
                return
              }
              stopped = false
              if (willPlay) {
                finish(operation, true)
              } else {
                call(
                  operation,
                  'pause',
                  undefined,
                  (paused, pauseCode, pauseMessage) => {
                    finish(operation, paused, pauseCode, pauseMessage)
                  },
                )
              }
            },
          )
        },
      )
    }, callback)
  }

  const cancelOperations = (code: number, message: string) => {
    const executing = active
    const waiting = pending
    active = undefined
    pending = undefined
    notify(() => {
      if (executing) finish(executing, false, code, message)
      if (waiting) finish(waiting, false, code, message)
      durationCallbacks.splice(0).forEach(callback =>
        callback(false, -1, code, message)
      )
    })
  }

  const controls: VideoRef = {
    play: callback => playback('play', callback),
    pause: callback => playback('pause', callback),
    stop: callback => playback('stop', callback),
    seek,
    replay,
    getDuration: callback => {
      if (!callback) return
      if (!available()) callback(false, -1, -111, 'resource not prepared')
      else if (failure) callback(false, -1, failure.errorCode, failure.errorMsg)
      else if (prepared) callback(true, duration)
      else durationCallbacks.push(callback)
    },
    operatePoster: visible => {
      if (!disposed) setPoster(visible)
    },
  }

  return {
    controls,
    firstFrame(seconds: number) {
      if (disposed) return
      duration = seconds * 1000
      failure = undefined
      if (prepared) return
      prepared = true
      notify(() => {
        if (!pending && !active && getProps().autoPlay) controls.play()
        getProps().onPrepared?.()
        if (disposed || failure) return
        getProps().onFirstFrame?.()
        if (disposed || failure) return
        setPoster(false)
      })
      if (disposed || failure) return
      while (durationCallbacks.length > 0 && !disposed && !failure) {
        durationCallbacks.shift()?.(true, duration)
      }
    },
    timeUpdate(current: number, total: number) {
      if (disposed) return
      duration = total * 1000
      if (restoringPlayback) return
      getProps().onTimeUpdate?.({
        detail: { current: current * 1000, total: duration },
      })
    },
    playing() {
      if (disposed) return
      stopped = false
      reportedPlaybackState = 'playing'
      if (restoringPlayback) return
      getProps().onPlay?.()
    },
    paused() {
      if (disposed) return
      reportedPlaybackState = 'paused'
      getProps().onPause?.()
    },
    stopped() {
      if (disposed) return
      stopped = true
      if (reportedPlaybackState === 'stopped') return
      reportedPlaybackState = 'stopped'
      getProps().onStop?.()
    },
    ended() {
      if (disposed) return
      notify(() => {
        stopped = true
        if (reportedPlaybackState !== 'stopped') {
          reportedPlaybackState = 'stopped'
          getProps().onStop?.()
        }
        if (!disposed) getProps().onEnded?.()
      })
    },
    looped() {
      if (!disposed) getProps().onEnded?.()
    },
    error(error: { errorCode: number, errorMsg: string }) {
      if (disposed) return
      failure = error
      notify(() => {
        cancelOperations(error.errorCode, error.errorMsg)
        getProps().onError?.(error)
      })
    },
    dispose() {
      if (disposed) return
      disposed = true
      cancelOperations(-111, 'resource changed or detached')
    },
  }
}
