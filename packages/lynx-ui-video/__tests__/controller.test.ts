// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, expect, it, vi } from 'vitest'

import { createVideoController, getVideoError } from '../src/controller'
import type { VideoInvoker } from '../src/controller'
import type { VideoProps } from '../src/types'

function setup(overrides: VideoProps = {}) {
  let props: VideoProps = {
    playUrl: 'https://example.com/video.mp4',
    ...overrides,
  }
  const calls: Parameters<VideoInvoker>[] = []
  const poster = vi.fn()
  const controller = createVideoController(
    (...args) => calls.push(args),
    () => props,
    poster,
  )
  return {
    controller,
    calls,
    poster,
    methods: () => calls.map(([method, position]) => [method, position]),
    updateProps: (next: Partial<VideoProps>) => {
      props = { ...props, ...next }
    },
    complete: (
      index: number,
      success = true,
      code?: number,
      message?: string,
    ) => {
      calls[index][2](success, code, message)
    },
  }
}

describe('Video playback controller', () => {
  it('prepares without playing and converts native seconds to public milliseconds', () => {
    const onFirstFrame = vi.fn()
    const onPrepared = vi.fn()
    const onTimeUpdate = vi.fn()
    const duration = vi.fn()
    const secondDuration = vi.fn()
    const state = setup({ onFirstFrame, onPrepared, onTimeUpdate })

    state.controller.controls.getDuration(duration)
    state.controller.controls.getDuration(secondDuration)
    state.controller.firstFrame(12.5)
    state.controller.firstFrame(12.5)

    expect(duration.mock.calls).toEqual([[true, 12500]])
    expect(secondDuration.mock.calls).toEqual([[true, 12500]])
    expect(onFirstFrame).toHaveBeenCalledOnce()
    expect(onPrepared).toHaveBeenCalledOnce()
    expect(state.poster.mock.calls).toEqual([[false]])
    expect(state.calls).toHaveLength(0)

    state.controller.timeUpdate(2.75, 12.6)
    expect(onTimeUpdate.mock.calls).toEqual([[{
      detail: { current: 2750, total: 12600 },
    }]])
    const currentDuration = vi.fn()
    state.controller.controls.getDuration(currentDuration)
    expect(currentDuration.mock.calls).toEqual([[true, 12600]])
  })

  it('keeps the latest command before preparation and lets it override autoplay', () => {
    const state = setup({ autoPlay: true })
    const play = vi.fn()
    const pause = vi.fn()
    state.controller.controls.play(play)
    state.controller.controls.pause(pause)

    expect(play.mock.calls).toEqual([[
      false,
      -222,
      'operation superseded',
    ]])
    expect(state.calls).toHaveLength(0)
    state.controller.firstFrame(10)
    expect(state.methods()).toEqual([['pause', undefined]])
    state.complete(0)
    expect(pause.mock.calls).toEqual([[true, undefined, undefined]])
    expect(state.calls).toHaveLength(1)
  })

  it('does not duplicate autoplay when the first-frame callback starts playback', () => {
    const state = setup({ autoPlay: true })
    state.updateProps({ onFirstFrame: () => state.controller.controls.play() })
    state.controller.firstFrame(10)
    state.complete(0)
    expect(state.methods()).toEqual([['play', undefined]])
  })

  it('serializes compound seeks and supersedes only waiting commands', () => {
    const onSeek = vi.fn()
    const state = setup({ onSeek })
    const first = vi.fn()
    const superseded = vi.fn()
    const last = vi.fn()
    state.controller.firstFrame(20)
    state.controller.controls.seek(5000, true, first)
    state.controller.controls.stop(superseded)
    state.controller.controls.seek(3000, false, last)

    expect(superseded.mock.calls).toEqual([[
      false,
      -222,
      'operation superseded',
    ]])
    expect(state.methods()).toEqual([['pause', undefined]])
    state.complete(0)
    expect(state.methods()).toEqual([['pause', undefined], ['seek', 5]])
    state.complete(1)
    expect(state.methods()).toEqual([['pause', undefined], ['seek', 5], [
      'play',
      undefined,
    ]])
    expect(onSeek).not.toHaveBeenCalled()
    state.complete(2)
    expect(first.mock.calls).toEqual([[true, undefined, undefined]])
    expect(state.methods().slice(3)).toEqual([['pause', undefined]])
    state.complete(3)
    state.complete(4)

    expect(state.methods().slice(3)).toEqual([['pause', undefined], [
      'seek',
      3,
    ]])
    expect(onSeek.mock.calls).toEqual([[true], [false]])
    expect(last.mock.calls).toEqual([[true, undefined, undefined]])
  })

  it('rebuilds the Android media item before seeking after stop', () => {
    const state = setup()
    const callback = vi.fn()
    state.controller.firstFrame(20)
    state.controller.controls.stop()
    state.complete(0)
    state.controller.controls.seek(6500, false, callback)

    expect(state.methods()).toEqual([['stop', undefined], ['play', undefined]])
    state.complete(1)
    state.complete(2)
    state.complete(3)
    expect(state.methods()).toEqual([
      ['stop', undefined],
      ['play', undefined],
      ['pause', undefined],
      ['seek', 6.5],
    ])
    expect(callback.mock.calls).toEqual([[true, undefined, undefined]])
  })

  it('replays with stop, play, and pause events without emitting seek', () => {
    const events: string[] = []
    const state = setup({
      onStop: () => events.push('stop'),
      onPlay: () => events.push('play'),
      onPause: () => events.push('pause'),
      onSeek: () => events.push('seek'),
    })
    const callback = vi.fn()
    state.controller.firstFrame(20)
    state.controller.playing()
    events.length = 0
    state.controller.controls.replay(false, callback)
    state.controller.stopped()
    state.complete(0)
    state.controller.playing()
    state.complete(1)
    state.controller.paused()
    state.complete(2)

    expect(state.methods()).toEqual([['stop', undefined], ['play', undefined], [
      'pause',
      undefined,
    ]])
    expect(events).toEqual(['stop', 'play', 'pause'])
    expect(callback.mock.calls).toEqual([[true, undefined, undefined]])
  })

  it('replays into playing without a seek or pause, and keeps later commands outside the replay chain', () => {
    const onSeek = vi.fn()
    const state = setup({ onSeek })
    const replay = vi.fn()
    const pause = vi.fn()
    state.controller.firstFrame(20)
    state.controller.controls.replay(true, replay)
    state.controller.controls.pause(pause)
    expect(state.methods()).toEqual([['stop', undefined]])
    state.complete(0)
    expect(state.methods()).toEqual([['stop', undefined], ['play', undefined]])
    state.complete(1)
    expect(replay.mock.calls).toEqual([[true, undefined, undefined]])
    expect(state.methods()).toEqual([['stop', undefined], ['play', undefined], [
      'pause',
      undefined,
    ]])
    state.complete(2)
    expect(pause.mock.calls).toEqual([[true, undefined, undefined]])
    expect(onSeek).not.toHaveBeenCalled()
  })

  it.each([0, 1, 2])(
    'stops replay(false) if native step %i fails',
    failureIndex => {
      const state = setup()
      const callback = vi.fn()
      state.controller.firstFrame(20)
      state.controller.controls.replay(false, callback)
      for (let index = 0; index < failureIndex; index++) state.complete(index)
      state.complete(failureIndex, false, 9, 'replay failed')
      state.complete(failureIndex)

      expect(state.calls).toHaveLength(failureIndex + 1)
      expect(callback.mock.calls).toEqual([[false, 9, 'replay failed']])
    },
  )

  it('cancels replay during playback restoration without sending its final pause', () => {
    const state = setup()
    const callback = vi.fn()
    state.controller.firstFrame(20)
    state.controller.controls.replay(false, callback)
    state.complete(0)
    state.controller.dispose()
    state.complete(1)

    expect(state.methods()).toEqual([['stop', undefined], ['play', undefined]])
    expect(callback.mock.calls).toEqual([[
      false,
      -111,
      'resource changed or detached',
    ]])
  })

  it('retains source restoration after replay fails to restart a stopped player', () => {
    const state = setup()
    state.controller.firstFrame(20)
    state.controller.controls.replay(false)
    state.complete(0)
    state.complete(1, false, 9, 'play failed')
    state.controller.controls.seek(1000, false)
    expect(state.methods()).toEqual([['stop', undefined], ['play', undefined], [
      'play',
      undefined,
    ]])
    state.complete(2)
    state.complete(3)
    state.complete(4)
    expect(state.methods().slice(3)).toEqual([['pause', undefined], [
      'seek',
      1,
    ]])
  })

  it.each([0, 1, 2])(
    'stops a seek chain if native step %i fails',
    failureIndex => {
      const onSeek = vi.fn()
      const callback = vi.fn()
      const state = setup({ onSeek })
      state.controller.firstFrame(20)
      state.controller.controls.seek(3000, true, callback)
      for (let index = 0; index < failureIndex; index++) state.complete(index)
      state.complete(failureIndex, false, 9, 'native request failed')

      expect(state.calls).toHaveLength(failureIndex + 1)
      expect(callback.mock.calls).toEqual([[
        false,
        9,
        'native request failed',
      ]])
      expect(onSeek).not.toHaveBeenCalled()
    },
  )

  it('cancels active and pending operations once, ignoring late native callbacks after disposal', () => {
    const state = setup()
    const active = vi.fn()
    const pending = vi.fn()
    state.controller.firstFrame(20)
    state.controller.controls.seek(3000, true, active)
    state.controller.controls.play(pending)
    state.controller.dispose()
    state.controller.dispose()
    state.complete(0)
    state.controller.controls.operatePoster(true)

    for (const callback of [active, pending]) {
      expect(callback.mock.calls).toEqual([[
        false,
        -111,
        'resource changed or detached',
      ]])
    }
    expect(state.methods()).toEqual([['pause', undefined]])
    expect(state.poster.mock.calls).toEqual([[false]])
  })

  it('cancels preparation and duration requests when the source is detached', () => {
    const state = setup()
    const playback = vi.fn()
    const duration = vi.fn()
    state.controller.controls.play(playback)
    state.controller.controls.getDuration(duration)
    state.controller.dispose()
    state.controller.firstFrame(20)

    expect(playback.mock.calls).toEqual([[
      false,
      -111,
      'resource changed or detached',
    ]])
    expect(duration.mock.calls).toEqual([[
      false,
      -1,
      -111,
      'resource changed or detached',
    ]])
    expect(state.calls).toHaveLength(0)
  })

  it('cancels both active and pending work on errors without continuing an old seek chain', () => {
    const onError = vi.fn()
    const active = vi.fn()
    const pending = vi.fn()
    const state = setup({ onError })
    state.controller.firstFrame(20)
    state.controller.controls.seek(3000, true, active)
    state.controller.controls.play(pending)
    state.controller.error({ errorCode: 5, errorMsg: 'decoder failed' })
    state.complete(0)

    for (const callback of [active, pending]) {
      expect(callback.mock.calls).toEqual([[
        false,
        5,
        'decoder failed',
      ]])
    }
    expect(onError.mock.calls).toEqual([[{
      errorCode: 5,
      errorMsg: 'decoder failed',
    }]])
    expect(state.methods()).toEqual([['pause', undefined]])
  })

  it('allows callback commands to replace waiting work without interleaving operations', () => {
    const state = setup()
    const superseded = vi.fn()
    state.controller.firstFrame(20)
    state.controller.controls.play(() =>
      state.controller.controls.seek(4000, false)
    )
    state.controller.controls.stop(superseded)
    state.complete(0)
    state.complete(1)
    state.complete(2)

    expect(superseded.mock.calls).toEqual([[
      false,
      -222,
      'operation superseded',
    ]])
    expect(state.methods()).toEqual([
      ['play', undefined],
      ['pause', undefined],
      ['seek', 4],
    ])
  })

  it('fails requests made after a loading error instead of waiting forever for a first frame', () => {
    const state = setup()
    const durationBeforeError = vi.fn()
    const durationAfterError = vi.fn()
    const playbackAfterError = vi.fn()
    state.controller.controls.getDuration(durationBeforeError)
    state.controller.error({ errorCode: 5, errorMsg: 'invalid source' })
    state.controller.controls.getDuration(durationAfterError)
    state.controller.controls.play(playbackAfterError)

    for (const callback of [durationBeforeError, durationAfterError]) {
      expect(callback.mock.calls).toEqual([[false, -1, 5, 'invalid source']])
    }
    expect(playbackAfterError.mock.calls).toEqual([[
      false,
      5,
      'invalid source',
    ]])
    expect(state.calls).toHaveLength(0)
  })

  it('ignores duplicate native callbacks within a compound operation', () => {
    const state = setup()
    const callback = vi.fn()
    state.controller.firstFrame(20)
    state.controller.controls.seek(1000, false, callback)
    state.complete(0)
    state.complete(0)
    state.complete(1)
    state.complete(1)

    expect(state.methods()).toEqual([['pause', undefined], ['seek', 1]])
    expect(callback).toHaveBeenCalledOnce()
  })

  it('delivers prepared before first-frame and cancels pending duration reads when first-frame replaces the source', () => {
    const state = setup()
    const onPrepared = vi.fn()
    const duration = vi.fn()
    state.updateProps({
      onFirstFrame: () => state.controller.dispose(),
      onPrepared,
    })
    state.controller.controls.getDuration(duration)
    state.controller.firstFrame(20)

    expect(onPrepared).toHaveBeenCalledOnce()
    expect(duration.mock.calls).toEqual([[
      false,
      -1,
      -111,
      'resource changed or detached',
    ]])
  })

  it('makes duration available to prepared before reporting the first frame', () => {
    const state = setup()
    const events: string[] = []
    const duration = vi.fn()
    state.updateProps({
      onPrepared: () => {
        events.push('prepared')
        state.controller.controls.getDuration(duration)
      },
      onFirstFrame: () => events.push('first-frame'),
    })
    state.controller.firstFrame(20)
    expect(events).toEqual(['prepared', 'first-frame'])
    expect(duration.mock.calls).toEqual([[true, 20000]])
  })

  it('does not emit the old first-frame event when prepared replaces the source', () => {
    const state = setup()
    const onFirstFrame = vi.fn()
    state.updateProps({
      onPrepared: () => state.controller.dispose(),
      onFirstFrame,
    })
    state.controller.firstFrame(20)
    expect(onFirstFrame).not.toHaveBeenCalled()
    expect(state.poster).not.toHaveBeenCalled()
  })

  it('reports natural completion as stop followed by ended, but loops only report ended', () => {
    const events: string[] = []
    const state = setup({
      onStop: () => events.push('stop'),
      onEnded: () => events.push('ended'),
    })
    state.controller.firstFrame(20)
    state.controller.playing()
    state.controller.looped()
    state.controller.looped()
    expect(events).toEqual(['ended', 'ended'])
    state.controller.ended()
    expect(events).toEqual(['ended', 'ended', 'stop', 'ended'])
  })

  it('does not duplicate a stop already reported before natural completion', () => {
    const onStop = vi.fn()
    const onEnded = vi.fn()
    const state = setup({ onStop, onEnded })
    state.controller.playing()
    state.controller.stopped()
    state.controller.ended()
    expect(onStop).toHaveBeenCalledOnce()
    expect(onEnded).toHaveBeenCalledOnce()
  })

  it('does not report stop when stopping the initially prepared player', () => {
    const onStop = vi.fn()
    const callback = vi.fn()
    const state = setup({ onStop })
    state.controller.firstFrame(20)
    state.controller.controls.stop(callback)
    state.complete(0)
    state.controller.stopped()

    expect(onStop).not.toHaveBeenCalled()
    expect(callback.mock.calls).toEqual([[true, undefined, undefined]])
  })

  it.each([false, true])(
    'reports stop once when the callback arrives before its event: %s',
    callbackFirst => {
      const onStop = vi.fn()
      const callback = vi.fn()
      const state = setup({ onStop })
      state.controller.firstFrame(20)
      state.controller.playing()
      state.controller.controls.stop(callback)
      if (callbackFirst) {
        state.complete(0)
        state.controller.stopped()
      } else {
        state.controller.stopped()
        state.complete(0)
      }
      state.controller.stopped()

      expect(onStop).toHaveBeenCalledOnce()
      expect(callback.mock.calls).toEqual([[true, undefined, undefined]])
    },
  )

  it('replays a stopped player without repeating stop and reports a subsequent real stop', () => {
    const events: string[] = []
    const callback = vi.fn()
    const state = setup({
      onStop: () => events.push('stop'),
      onPlay: () => events.push('play'),
      onPause: () => events.push('pause'),
    })
    state.controller.firstFrame(20)
    state.controller.playing()
    state.controller.stopped()
    events.length = 0
    state.controller.controls.replay(false, callback)
    state.complete(0)
    state.controller.stopped()
    state.controller.playing()
    state.complete(1)
    state.controller.paused()
    state.complete(2)

    expect(events).toEqual(['play', 'pause'])
    expect(callback.mock.calls).toEqual([[true, undefined, undefined]])

    state.controller.controls.stop()
    state.complete(3)
    state.controller.stopped()
    expect(events).toEqual(['play', 'pause', 'stop'])
  })

  it.each([false, true])(
    'hides bootstrap play and progress while restoring a stopped source for seek(%s)',
    willPlay => {
      const onPlay = vi.fn()
      const onPause = vi.fn()
      const onSeek = vi.fn()
      const onTimeUpdate = vi.fn()
      const state = setup({ onPlay, onPause, onSeek, onTimeUpdate })
      state.controller.firstFrame(20)
      state.controller.stopped()
      state.controller.controls.seek(3000, willPlay)
      state.controller.playing()
      state.controller.timeUpdate(0.1, 20)
      state.complete(0)
      state.controller.paused()
      state.controller.timeUpdate(0.2, 20)
      state.complete(1)
      state.complete(2)

      expect(onPlay).not.toHaveBeenCalled()
      expect(onTimeUpdate).not.toHaveBeenCalled()
      expect(onPause).toHaveBeenCalledOnce()
      if (willPlay) {
        state.controller.playing()
        state.complete(3)
        state.controller.timeUpdate(3.1, 20)
      }
      expect(onPlay).toHaveBeenCalledTimes(willPlay ? 1 : 0)
      expect(onTimeUpdate.mock.calls).toEqual(
        willPlay
          ? [[{ detail: { current: 3100, total: 20000 } }]]
          : [],
      )
      expect(onSeek.mock.calls).toEqual([[willPlay]])
    },
  )

  it('cancels remaining duration callbacks if an earlier callback replaces the source', () => {
    const state = setup()
    const duration = vi.fn()
    state.controller.controls.getDuration(() => state.controller.dispose())
    state.controller.controls.getDuration(duration)
    state.controller.firstFrame(20)

    expect(duration.mock.calls).toEqual([[
      false,
      -1,
      -111,
      'resource changed or detached',
    ]])
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])(
    'rejects invalid seek position %s before invoking native code',
    position => {
      const state = setup()
      const callback = vi.fn()
      state.controller.firstFrame(20)
      state.controller.controls.seek(position, false, callback)
      expect(callback.mock.calls).toEqual([[
        false,
        -1,
        'position must be a non-negative finite number',
      ]])
      expect(state.calls).toHaveLength(0)
    },
  )

  it.each([{ attached: false }, { playUrl: undefined }])(
    'rejects operations without an attached source: %s',
    props => {
      const state = setup(props)
      const callback = vi.fn()
      state.controller.controls.play(callback)
      expect(callback.mock.calls).toEqual([[
        false,
        -111,
        'resource not prepared',
      ]])
      expect(state.calls).toHaveLength(0)
    },
  )
})

describe('native video errors', () => {
  it.each([
    [{
      code: 4,
      data: { success: false, errorCode: 4, msg: 'invalid position' },
    }, { code: 4, message: 'invalid position' }],
    [{ code: 3, data: 'element not found' }, {
      code: 3,
      message: 'element not found',
    }],
    [{ success: false, errorCode: 2, msg: 'player stopped' }, {
      code: 2,
      message: 'player stopped',
    }],
    [{ errorCode: 7, errorMsg: 'decoder error' }, {
      code: 7,
      message: 'decoder error',
    }],
    [undefined, { code: -1, message: 'Video operation failed' }],
  ])('normalizes %s', (response, expected) => {
    expect(getVideoError(response)).toEqual(expected)
  })
})
