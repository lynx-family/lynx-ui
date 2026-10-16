// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createRef } from '@lynx-js/react'

import {
  act,
  createEvent,
  fireEvent,
  render,
} from '@lynx-js/react/testing-library'
import { describe, expect, it, vi } from 'vitest'

import { Video } from '../src'
import type { VideoRef } from '../src'

// cspell:ignore firstframe timeupdate

function nativeEvent(element: Element, name: string, detail: object = {}) {
  const event = createEvent(`bindEvent:${name}`, element)
  Object.assign(event, { eventType: 'bindEvent', eventName: name, detail })
  fireEvent(
    lynx.createSelectorQuery().select(element.tagName.toLowerCase()),
    event,
  )
}

describe('Video component lifecycle', () => {
  it('reports the initial source without stopping and ignores same-source rerenders', () => {
    const onSrcChanged = vi.fn()
    const onStop = vi.fn()
    const { container, rerender } = render(
      <Video playUrl='first.mp4' onSrcChanged={onSrcChanged} onStop={onStop} />,
    )
    expect(onSrcChanged).toHaveBeenCalledOnce()
    expect(onStop).not.toHaveBeenCalled()

    const player = container.querySelector('video')!
    nativeEvent(player, 'playing')
    rerender(
      <Video
        playUrl='first.mp4'
        className='updated'
        mute
        onSrcChanged={onSrcChanged}
        onStop={onStop}
      />,
    )
    expect(container.querySelector('video')).toBe(player)
    expect(onSrcChanged).toHaveBeenCalledOnce()
    expect(onStop).not.toHaveBeenCalled()
  })

  it.each(['playing', 'paused'])(
    'reports source before stop when replacing a %s player',
    playbackEvent => {
      const events: string[] = []
      const handlers = {
        onSrcChanged: () => events.push('source'),
        onStop: () => events.push('stop'),
      }
      const { container, rerender } = render(
        <Video playUrl='first.mp4' {...handlers} />,
      )
      const player = container.querySelector('video')!
      nativeEvent(player, playbackEvent)
      events.length = 0

      rerender(<Video playUrl='second.mp4' {...handlers} />)

      expect(events).toEqual(['source', 'stop'])
      expect(container.querySelector('video')).not.toBe(player)
      expect(container.querySelector('video')?.getAttribute('src')).toBe(
        'second.mp4',
      )
    },
  )

  it('replaces an already stopped source without a duplicate stop', () => {
    const events: string[] = []
    const handlers = {
      onSrcChanged: () => events.push('source'),
      onStop: () => events.push('stop'),
    }
    const { container, rerender } = render(
      <Video playUrl='first.mp4' {...handlers} />,
    )
    nativeEvent(container.querySelector('video')!, 'playing')
    nativeEvent(container.querySelector('video')!, 'stopped')
    events.length = 0

    rerender(<Video playUrl='second.mp4' {...handlers} />)

    expect(events).toEqual(['source'])
  })

  it('detaches and reattaches without reporting a source change or stop', () => {
    const onSrcChanged = vi.fn()
    const onStop = vi.fn()
    const handlers = { onSrcChanged, onStop }
    const { container, rerender } = render(
      <Video playUrl='first.mp4' {...handlers} />,
    )
    nativeEvent(container.querySelector('video')!, 'playing')

    rerender(<Video playUrl='first.mp4' attached={false} {...handlers} />)
    expect(container.querySelector('video')).toBeNull()
    expect(onSrcChanged).toHaveBeenCalledOnce()
    expect(onStop).not.toHaveBeenCalled()

    rerender(<Video playUrl='first.mp4' attached {...handlers} />)
    expect(container.querySelector('video')).not.toBeNull()
    expect(onSrcChanged).toHaveBeenCalledOnce()
    expect(onStop).not.toHaveBeenCalled()

    rerender(<Video playUrl='second.mp4' attached={false} {...handlers} />)
    expect(onSrcChanged).toHaveBeenCalledTimes(2)
    expect(onStop).not.toHaveBeenCalled()
  })

  it('hides the poster after the first frame and resets it for a replacement source', async () => {
    const ref = createRef<VideoRef>()
    const onPrepared = vi.fn()
    const onFirstFrame = vi.fn()
    const props = { ref, poster: 'poster.jpg', onPrepared, onFirstFrame }
    const { container, rerender } = render(
      <Video playUrl='first.mp4' {...props} />,
    )
    expect(container.querySelector('image')?.getAttribute('src')).toBe(
      'poster.jpg',
    )

    await act(() => {
      nativeEvent(container.querySelector('video')!, 'firstframe', {
        duration: 12.5,
      })
    })
    expect(container.querySelector('image')).toBeNull()
    expect(onPrepared).toHaveBeenCalledOnce()
    expect(onFirstFrame).toHaveBeenCalledOnce()
    const duration = vi.fn()
    ref.current?.getDuration(duration)
    expect(duration).toHaveBeenCalledWith(true, 12_500)

    await act(() => ref.current?.operatePoster(true))
    expect(container.querySelector('image')).not.toBeNull()
    await act(() => ref.current?.operatePoster(false))
    expect(container.querySelector('image')).toBeNull()

    rerender(<Video playUrl='second.mp4' {...props} />)
    expect(container.querySelector('image')).not.toBeNull()
    await act(() => {
      nativeEvent(container.querySelector('video')!, 'firstframe', {
        duration: 4,
      })
    })
    expect(container.querySelector('image')).toBeNull()
    expect(onPrepared).toHaveBeenCalledTimes(2)
    expect(onFirstFrame).toHaveBeenCalledTimes(2)
  })

  it('keeps native scaling for the current source while updating poster scaling', () => {
    const { container, rerender } = render(
      <Video playUrl='first.mp4' poster='poster.jpg' objectfit='aspectFit' />,
    )
    const player = container.querySelector('video')!
    expect(player.getAttribute('object-fit')).toBe('contain')
    expect(container.querySelector('image')?.getAttribute('mode')).toBe(
      'aspectFit',
    )

    for (const objectfit of ['aspectFill', 'scaleToFill'] as const) {
      rerender(
        <Video playUrl='first.mp4' poster='poster.jpg' objectfit={objectfit} />,
      )
      expect(container.querySelector('video')).toBe(player)
      expect(player.getAttribute('object-fit')).toBe('contain')
      expect(container.querySelector('image')?.getAttribute('mode')).toBe(
        objectfit,
      )
    }
  })

  it.each(
    [
      ['aspectFill', 'cover'],
      ['scaleToFill', 'fill'],
      ['aspectFit', 'contain'],
    ] as const,
  )('applies %s scaling to a replacement source', (objectfit, fit) => {
    const { container, rerender } = render(
      <Video playUrl='first.mp4' objectfit='scaleToFill' />,
    )
    const player = container.querySelector('video')!

    rerender(<Video playUrl='first.mp4' objectfit={objectfit} />)
    expect(player.getAttribute('object-fit')).toBe('fill')
    rerender(<Video playUrl='second.mp4' objectfit={objectfit} />)

    expect(container.querySelector('video')).not.toBe(player)
    expect(container.querySelector('video')?.getAttribute('object-fit')).toBe(
      fit,
    )
  })

  it('applies the latest scaling when reattaching the same source', () => {
    const { container, rerender } = render(
      <Video playUrl='first.mp4' objectfit='aspectFit' />,
    )
    const player = container.querySelector('video')!
    rerender(<Video playUrl='first.mp4' objectfit='scaleToFill' />)
    expect(player.getAttribute('object-fit')).toBe('contain')

    rerender(
      <Video playUrl='first.mp4' objectfit='scaleToFill' attached={false} />,
    )
    expect(container.querySelector('video')).toBeNull()
    rerender(<Video playUrl='first.mp4' objectfit='aspectFill' attached />)

    expect(container.querySelector('video')).not.toBe(player)
    expect(container.querySelector('video')?.getAttribute('object-fit')).toBe(
      'cover',
    )
  })

  it('maps native seconds and event details to the VideoEngine event signatures', () => {
    const onPlay = vi.fn()
    const onPause = vi.fn()
    const onTimeUpdate = vi.fn()
    const onError = vi.fn()
    const { container } = render(
      <Video
        playUrl='video.mp4'
        onPlay={onPlay}
        onPause={onPause}
        onTimeUpdate={onTimeUpdate}
        onError={onError}
      />,
    )
    const player = container.querySelector('video')!
    nativeEvent(player, 'playing', { nativeOnly: true })
    nativeEvent(player, 'paused', { nativeOnly: true })
    nativeEvent(player, 'timeupdate', { current: 1.25, duration: 12.5 })
    nativeEvent(player, 'error', { errorCode: 9, errorMsg: 'decode failed' })

    expect(onPlay).toHaveBeenCalledWith()
    expect(onPause).toHaveBeenCalledWith()
    expect(onTimeUpdate).toHaveBeenCalledWith({
      detail: { current: 1250, total: 12_500 },
    })
    expect(onError).toHaveBeenCalledWith({
      errorCode: 9,
      errorMsg: 'decode failed',
    })
  })

  it('maps a loop iteration to ended and a final ending to stop before ended', () => {
    const events: string[] = []
    const { container } = render(
      <Video
        playUrl='video.mp4'
        loop
        onStop={() => events.push('stop')}
        onEnded={() => events.push('ended')}
      />,
    )
    const player = container.querySelector('video')!
    nativeEvent(player, 'playing')
    nativeEvent(player, 'looped')
    expect(events).toEqual(['ended'])

    nativeEvent(player, 'ended')
    expect(events).toEqual(['ended', 'stop', 'ended'])
  })
})
