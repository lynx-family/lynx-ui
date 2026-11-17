// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useEffect, useRef } from '@lynx-js/react'

import {
  act,
  cleanup,
  fireEvent,
  render,
} from '@lynx-js/react/testing-library/pure'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Presence, usePresenceAnimation } from '../src'
import type { PresenceAnimationDriver } from '../src'

let frames: (() => void)[]
beforeEach(() => {
  frames = []
  Object.assign(lynx, {
    requestAnimationFrame: (callback: () => void) => frames.push(callback),
  })
})
afterEach(() => {
  act(() => cleanup())
  lynxTestingEnv.reset()
})
async function advance(count: number) {
  for (let i = 0; i < count; i++) {
    await act(async () => {
      frames.splice(0).forEach(callback => callback())
      await Promise.resolve()
    })
  }
}

function Driver({
  register,
  animate,
}: {
  register: (driver: PresenceAnimationDriver) => () => void
  animate: PresenceAnimationDriver
}) {
  const latest = useRef(animate)
  latest.current = animate
  useEffect(() => register(event => latest.current(event)), [register])
  return <view id='content' />
}

function Fixture({
  show,
  animate,
  onOpen,
  onClose,
  waitForReady,
}: {
  show: boolean
  animate: PresenceAnimationDriver
  onOpen?: () => void
  onClose?: () => void
  waitForReady?: boolean
}) {
  const presence = usePresenceAnimation({ show, onOpen, onClose, waitForReady })
  return (
    <view>
      <view id='ready' bindtap={presence.markReady} />
      <Presence
        show={show}
        state={presence.state}
        setPresenceState={presence.updatePresence}
        onOpen={presence.handleOpen}
        onClose={presence.handleClose}
      >
        <Driver register={presence.registerAnimation} animate={animate} />
      </Presence>
    </view>
  )
}

describe('Presence animation driver', () => {
  it('retains content during exit and ignores an interrupted completion', async () => {
    const transitions: Parameters<PresenceAnimationDriver>[0][] = []
    const cancel = vi.fn()
    const animate: PresenceAnimationDriver = event => {
      transitions.push(event)
      return cancel
    }
    const onOpen = vi.fn()
    const onClose = vi.fn()
    const { container, rerender } = render(
      <Fixture
        show={true}
        animate={animate}
        onOpen={onOpen}
        onClose={onClose}
      />,
    )
    await advance(60)
    expect(transitions).toHaveLength(1)
    expect(onOpen).not.toHaveBeenCalled()
    act(() => transitions[0]!.complete())
    expect(onOpen).toHaveBeenCalledOnce()

    rerender(
      <Fixture
        show={false}
        animate={animate}
        onOpen={onOpen}
        onClose={onClose}
      />,
    )
    expect(container.querySelector('#content')).not.toBeNull()
    const exit = transitions[1]!
    rerender(
      <Fixture
        show={true}
        animate={animate}
        onOpen={onOpen}
        onClose={onClose}
      />,
    )
    act(() => exit.complete())
    expect(onClose).not.toHaveBeenCalled()
    expect(cancel).toHaveBeenCalled()
    expect(container.querySelector('#content')).not.toBeNull()
    expect(transitions[2]!.open).toBe(true)
  })

  it('can wait for a consumer to signal readiness before entering', async () => {
    const animate = vi.fn()
    const { container } = render(
      <Fixture show={true} animate={animate} waitForReady={true} />,
    )
    await advance(60)
    expect(animate).not.toHaveBeenCalled()
    act(() => fireEvent.tap(container.querySelector('#ready')!))
    expect(animate).toHaveBeenCalledOnce()
    expect(animate.mock.calls[0]![0].open).toBe(true)
  })

  it('retains readiness signaled before the entering state', async () => {
    const animate = vi.fn()
    const { container } = render(
      <Fixture show={true} animate={animate} waitForReady={true} />,
    )
    act(() => fireEvent.tap(container.querySelector('#ready')!))
    await advance(60)
    expect(animate).toHaveBeenCalledOnce()
    expect(animate.mock.calls[0]![0].open).toBe(true)
  })

  it('requires a new readiness signal after a completed exit', async () => {
    const transitions: Parameters<PresenceAnimationDriver>[0][] = []
    const animate: PresenceAnimationDriver = event => {
      transitions.push(event)
    }
    const { container, rerender } = render(
      <Fixture show={true} animate={animate} waitForReady={true} />,
    )
    act(() => fireEvent.tap(container.querySelector('#ready')!))
    await advance(20)
    act(() => transitions[0]!.complete())
    rerender(<Fixture show={false} animate={animate} waitForReady={true} />)
    act(() => transitions[1]!.complete())
    rerender(<Fixture show={true} animate={animate} waitForReady={true} />)
    await advance(60)
    expect(transitions).toHaveLength(2)
    act(() => fireEvent.tap(container.querySelector('#ready')!))
    expect(transitions[2]!.open).toBe(true)
  })
})
