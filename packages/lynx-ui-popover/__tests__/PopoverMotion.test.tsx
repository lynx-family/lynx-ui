// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useContext, useEffect, useRef } from '@lynx-js/react'

import {
  act,
  cleanup,
  fireEvent,
  render,
} from '@lynx-js/react/testing-library/pure'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  PopoverArrow,
  PopoverContent,
  PopoverContext,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from '../src'
import {
  PopoverAnimationContext,
  PopoverGeometryContext,
} from '../src/motionContext'
import type { PopoverAnimationDriver } from '../src/motionContext'

type PopoverAnimation = Parameters<PopoverAnimationDriver>[0]

// These cases exercise Presence with a controlled driver, not Motion's native scheduler.
vi.mock('@lynx-js/motion/mini', () => ({
  animate: vi.fn(),
  createMotionValue: vi.fn(),
  easeIn: vi.fn(),
  easeOut: vi.fn(),
  easeInOut: vi.fn(),
  linear: vi.fn(),
}))

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
async function advance(count = 1) {
  for (let i = 0; i < count; i++) {
    await act(async () => {
      const pending = frames.splice(0)
      pending.forEach(callback => callback())
      await Promise.resolve()
    })
  }
}
// Supply dimensions normally delivered by native layoutchange, without adding
// a native measurement engine to Popover or mocking Presence's lifecycle.
function Layout() {
  const { updateRects } = useContext(PopoverContext)
  useEffect(() => {
    updateRects({
      type: 'updateReference',
      rect: { x: 100, y: 300, width: 40, height: 40 },
    })
    updateRects({
      type: 'updateFloating',
      rect: { x: 0, y: 0, width: 120, height: 48 },
    })
  }, [])
  return null
}
function Fixture(
  {
    show = true,
    onAnimate,
    onOpen,
    onClose,
    onVisibleChange,
    contentKey,
    placement = 'top',
    arrow = true,
  }: {
    show?: boolean
    arrow?: boolean
    onAnimate?: PopoverAnimationDriver
    onOpen?: () => void
    onClose?: () => void
    onVisibleChange?: (visible: boolean) => void
    contentKey?: number
    placement?: 'top' | 'bottom' | 'left' | 'right'
  },
) {
  return (
    <PopoverRoot
      show={show}
      onOpen={onOpen}
      onClose={onClose}
      onVisibleChange={onVisibleChange}
    >
      <PopoverTrigger className='trigger'>
        <text>Trigger</text>
        <PopoverPositioner placement={placement}>
          <TestContent key={contentKey} onAnimate={onAnimate} arrow={arrow} />
        </PopoverPositioner>
      </PopoverTrigger>
    </PopoverRoot>
  )
}

function TestContent(
  { onAnimate, arrow }: { onAnimate?: PopoverAnimationDriver, arrow: boolean },
) {
  const register = useContext(PopoverAnimationContext)!
  const origin = useContext(PopoverGeometryContext)
  const latestDriver = useRef(onAnimate)
  latestDriver.current = onAnimate
  useEffect(
    () =>
      onAnimate
        ? register(animation => latestDriver.current?.(animation))
        : undefined,
    [register, !!onAnimate],
  )
  return (
    <PopoverContent
      style={{ transformOrigin: origin }}
      popoverContentProps={{ id: 'bubble' }}
    >
      <Layout />
      <text>Bubble</text>
      {arrow
        ? (
          <PopoverArrow size={{ width: 21, height: 8 }} offset={12}>
            <view />
          </PopoverArrow>
        )
        : null}
    </PopoverContent>
  )
}

describe('Popover custom animation with existing Popover and Presence', () => {
  it('transfers an in-progress entry to replacement content', async () => {
    const transitions: PopoverAnimation[] = []
    const cancel = vi.fn()
    const onAnimate = (animation: PopoverAnimation) => {
      transitions.push(animation)
      return cancel
    }
    const onOpen = vi.fn()
    const { rerender } = render(
      <Fixture contentKey={1} onAnimate={onAnimate} onOpen={onOpen} />,
    )
    await advance(20)
    const first = transitions[0]!
    rerender(<Fixture contentKey={2} onAnimate={onAnimate} onOpen={onOpen} />)
    await advance(20)
    expect(cancel).toHaveBeenCalled()
    expect(transitions).toHaveLength(2)
    expect(transitions[1]!.open).toBe(true)
    expect(onOpen).not.toHaveBeenCalled()
    act(() => first.complete())
    expect(onOpen).not.toHaveBeenCalled()
    act(() => transitions[1]!.complete())
    expect(onOpen).toHaveBeenCalledOnce()
  })
  it('synchronizes replacement content mounted after entry without repeating onOpen', async () => {
    const transitions: PopoverAnimation[] = []
    const onAnimate = (animation: PopoverAnimation) => {
      transitions.push(animation)
      return undefined
    }
    const onOpen = vi.fn()
    const { rerender } = render(
      <Fixture contentKey={1} onAnimate={onAnimate} onOpen={onOpen} />,
    )
    await advance(20)
    act(() => transitions[0]!.complete())
    rerender(<Fixture contentKey={2} onAnimate={onAnimate} onOpen={onOpen} />)
    await advance(20)
    expect(transitions).toHaveLength(2)
    expect(transitions[1]).toMatchObject({ open: true, immediate: true })
    act(() => transitions[1]!.complete())
    expect(onOpen).toHaveBeenCalledOnce()
  })
  it('transfers an in-progress exit to replacement content', async () => {
    const transitions: PopoverAnimation[] = []
    const onAnimate = (animation: PopoverAnimation) => {
      transitions.push(animation)
      return undefined
    }
    const onClose = vi.fn()
    const { rerender, container } = render(
      <Fixture contentKey={1} onAnimate={onAnimate} onClose={onClose} />,
    )
    await advance(20)
    act(() => transitions[0]!.complete())
    rerender(
      <Fixture
        show={false}
        contentKey={1}
        onAnimate={onAnimate}
        onClose={onClose}
      />,
    )
    const firstExit = transitions[1]!
    rerender(
      <Fixture
        show={false}
        contentKey={2}
        onAnimate={onAnimate}
        onClose={onClose}
      />,
    )
    await advance(20)
    expect(transitions).toHaveLength(3)
    expect(transitions[2]!.open).toBe(false)
    act(() => firstExit.complete())
    expect(onClose).not.toHaveBeenCalled()
    expect(container.querySelector('#bubble')).not.toBeNull()
    act(() => transitions[2]!.complete())
    expect(onClose).toHaveBeenCalledOnce()
    expect(container.querySelector('#bubble')).toBeNull()
  })
  it('allows a motion-driven popover to be closed while entering', async () => {
    const onVisibleChange = vi.fn()
    const { container } = render(
      <Fixture onAnimate={() => undefined} onVisibleChange={onVisibleChange} />,
    )
    await advance(20)
    act(() => fireEvent.tap(container.querySelector('.trigger')!))
    expect(onVisibleChange).toHaveBeenCalledWith(false)
  })
  it('allows a motion-driven popover to be reopened while leaving', async () => {
    const transitions: PopoverAnimation[] = []
    const onAnimate = (animation: PopoverAnimation) => {
      transitions.push(animation)
    }
    const onVisibleChange = vi.fn()
    const { container, rerender } = render(
      <Fixture onAnimate={onAnimate} onVisibleChange={onVisibleChange} />,
    )
    await advance(20)
    act(() => transitions[0]!.complete())
    rerender(
      <Fixture
        show={false}
        onAnimate={onAnimate}
        onVisibleChange={onVisibleChange}
      />,
    )
    act(() => fireEvent.tap(container.querySelector('.trigger')!))
    expect(onVisibleChange).toHaveBeenCalledWith(true)
  })
  it('preserves the existing busy trigger behavior without motion', async () => {
    const onVisibleChange = vi.fn()
    const { container } = render(<Fixture onVisibleChange={onVisibleChange} />)
    await advance(20)
    act(() => fireEvent.tap(container.querySelector('.trigger')!))
    expect(onVisibleChange).not.toHaveBeenCalled()
  })
  it('preserves the existing visibility during CSS-only reopening', async () => {
    const { container, rerender } = render(<Fixture />)
    await advance(60)
    rerender(<Fixture show={false} />)
    rerender(<Fixture />)
    await advance(8)
    const bubble = container.querySelector('#bubble') as HTMLElement
    expect(bubble.parentElement?.style.visibility).toBe('hidden')
  })
  it('waits beyond the CSS fallback and unmounts only on completion', async () => {
    const transitions: PopoverAnimation[] = []
    const onAnimate = vi.fn((animation: PopoverAnimation) => {
      transitions.push(animation)
      return undefined
    })
    const onOpen = vi.fn()
    const onClose = vi.fn()
    const { container, rerender } = render(
      <Fixture onAnimate={onAnimate} onOpen={onOpen} onClose={onClose} />,
    )
    await advance(60)
    expect(transitions).toHaveLength(1)
    expect(transitions[0]!.open).toBe(true)
    expect(onOpen).not.toHaveBeenCalled()
    act(() => transitions[0]!.complete())
    expect(onOpen).toHaveBeenCalledTimes(1)
    rerender(
      <Fixture
        show={false}
        onAnimate={onAnimate}
        onOpen={onOpen}
        onClose={onClose}
      />,
    )
    await advance(60)
    expect(transitions).toHaveLength(2)
    expect(transitions[1]!.open).toBe(false)
    expect(container.querySelector('#bubble')).not.toBeNull()
    act(() => {
      transitions[1]!.complete()
      transitions[1]!.complete()
    })
    expect(container.querySelector('#bubble')).toBeNull()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
  it('cancels interrupted work and ignores a stale exit after reopening', async () => {
    const transitions: PopoverAnimation[] = []
    const cancel = vi.fn()
    const onAnimate = (animation: PopoverAnimation) => {
      transitions.push(animation)
      return cancel
    }
    const { container, rerender } = render(<Fixture onAnimate={onAnimate} />)
    await advance(20)
    rerender(<Fixture show={false} onAnimate={onAnimate} />)
    const exit = transitions[transitions.length - 1]!
    expect(exit.open).toBe(false)
    expect(cancel).toHaveBeenCalledTimes(1)
    rerender(<Fixture onAnimate={onAnimate} />)
    act(() => exit.complete())
    await advance(60)
    expect(container.querySelector('#bubble')).not.toBeNull()
    expect(transitions[transitions.length - 1]!.open).toBe(true)
  })
  it('keeps an interrupted exit visible while the next entry is positioned', async () => {
    const transitions: PopoverAnimation[] = []
    const onAnimate = (animation: PopoverAnimation) => {
      transitions.push(animation)
      return undefined
    }
    const { container, rerender } = render(<Fixture onAnimate={onAnimate} />)
    await advance(20)
    act(() => transitions[0]!.complete())
    rerender(<Fixture show={false} onAnimate={onAnimate} />)
    rerender(<Fixture onAnimate={onAnimate} />)
    expect(transitions.map(transition => transition.open)).toEqual([
      true,
      false,
      true,
    ])
    await advance(10)
    const bubble = container.querySelector('#bubble') as HTMLElement
    expect(bubble.parentElement?.style.visibility).toBe('visible')
    await advance(20)
    expect(transitions).toHaveLength(3)
  })
  it('finishes an immediate reversal after the pending entry delay', async () => {
    const transitions: PopoverAnimation[] = []
    const onAnimate = (animation: PopoverAnimation) => {
      transitions.push(animation)
      return undefined
    }
    const { container, rerender } = render(<Fixture onAnimate={onAnimate} />)
    await advance(20)
    act(() => transitions[0]!.complete())
    rerender(<Fixture show={false} onAnimate={onAnimate} />)
    rerender(<Fixture onAnimate={onAnimate} />)
    act(() => transitions[2]!.complete())
    await advance(60)
    expect(transitions).toHaveLength(3)
    expect(container.querySelector('#bubble')).not.toBeNull()
    rerender(<Fixture show={false} onAnimate={onAnimate} />)
    expect(transitions[3]!.open).toBe(false)
    act(() => transitions[3]!.complete())
    expect(container.querySelector('#bubble')).toBeNull()
  })
  it('notifies when a previously open popover finishes reopening', async () => {
    const transitions: PopoverAnimation[] = []
    const onAnimate = (animation: PopoverAnimation) => {
      transitions.push(animation)
      return undefined
    }
    const onOpen = vi.fn()
    const { rerender } = render(
      <Fixture onAnimate={onAnimate} onOpen={onOpen} />,
    )
    await advance(20)
    act(() => transitions[0]!.complete())
    expect(onOpen).toHaveBeenCalledTimes(1)
    rerender(<Fixture show={false} onAnimate={onAnimate} onOpen={onOpen} />)
    rerender(<Fixture onAnimate={onAnimate} onOpen={onOpen} />)
    await advance(20)
    act(() => transitions[2]!.complete())
    expect(onOpen).toHaveBeenCalledTimes(2)
  })
  it('releases presence when motion content is removed during exit', async () => {
    const transitions: PopoverAnimation[] = []
    const onAnimate = (animation: PopoverAnimation) => {
      transitions.push(animation)
      return undefined
    }
    const onClose = vi.fn()
    const { container, rerender } = render(
      <Fixture onAnimate={onAnimate} onClose={onClose} />,
    )
    await advance(20)
    act(() => transitions[0]!.complete())
    rerender(<Fixture show={false} onAnimate={onAnimate} onClose={onClose} />)
    rerender(<Fixture show={false} onClose={onClose} />)
    await advance(60)
    expect(container.querySelector('#bubble')).toBeNull()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
  it('returns to the CSS lifecycle when motion content is removed while open', async () => {
    const transitions: PopoverAnimation[] = []
    const onAnimate = (animation: PopoverAnimation) => {
      transitions.push(animation)
    }
    const onClose = vi.fn()
    const { container, rerender } = render(
      <Fixture onAnimate={onAnimate} onClose={onClose} />,
    )
    await advance(20)
    act(() => transitions[0]!.complete())
    rerender(<Fixture onClose={onClose} />)
    await advance(5)
    rerender(<Fixture show={false} onClose={onClose} />)
    await advance(60)
    expect(container.querySelector('#bubble')).toBeNull()
    expect(onClose).toHaveBeenCalledOnce()
  })
  it('reports a close even when entering was interrupted before onOpen', async () => {
    const transitions: PopoverAnimation[] = []
    const onAnimate = (animation: PopoverAnimation) => {
      transitions.push(animation)
      return undefined
    }
    const onClose = vi.fn()
    const onOpen = vi.fn()
    const { rerender } = render(
      <Fixture onAnimate={onAnimate} onOpen={onOpen} onClose={onClose} />,
    )
    await advance(20)
    const enter = transitions[0]!
    rerender(
      <Fixture
        show={false}
        onAnimate={onAnimate}
        onOpen={onOpen}
        onClose={onClose}
      />,
    )
    act(() => enter.complete())
    expect(onOpen).not.toHaveBeenCalled()
    act(() => transitions[transitions.length - 1]!.complete())
    expect(onClose).toHaveBeenCalledTimes(1)
  })
  it.each(
    [
      ['top', '60px 56px'],
      ['bottom', '60px -8px'],
      ['left', '128px 24px'],
      ['right', '-8px 24px'],
    ] as const,
  )(
    'exposes the positioned rectangular arrow tip at %s',
    async (placement, origin) => {
      const { container } = render(<Fixture placement={placement} />)
      await advance(20)
      expect(
        (container.querySelector('#bubble') as HTMLElement).style
          .transformOrigin,
      ).toBe(origin)
    },
  )
  it('uses the content edge when the arrow is omitted', async () => {
    const { container } = render(<Fixture arrow={false} />)
    await advance(20)
    expect(
      (container.querySelector('#bubble') as HTMLElement).style.transformOrigin,
    ).toBe('60px 48px')
  })
  it('cancels on unmount and rejects completion from the removed content', async () => {
    const cancel = vi.fn()
    let transition: PopoverAnimation | undefined
    const onAnimate = (animation: PopoverAnimation) => {
      transition = animation
      return cancel
    }
    const { unmount } = render(<Fixture onAnimate={onAnimate} />)
    await advance(20)
    act(() => unmount())
    expect(cancel).toHaveBeenCalledTimes(1)
    act(() => transition?.complete())
  })
  it('does not restart an animation when the parent recreates its driver', async () => {
    const driver = vi.fn()
    const { rerender } = render(
      <Fixture onAnimate={animation => driver(animation)} />,
    )
    await advance(20)
    rerender(<Fixture onAnimate={animation => driver(animation)} />)
    await advance(60)
    expect(driver).toHaveBeenCalledTimes(1)
  })
  it('keeps the existing CSS/no-animation lifecycle when no driver is supplied', async () => {
    const onOpen = vi.fn()
    const { container, rerender } = render(<Fixture onOpen={onOpen} />)
    await advance(60)
    expect(onOpen).toHaveBeenCalledTimes(1)
    rerender(<Fixture show={false} onOpen={onOpen} />)
    await advance(60)
    expect(container.querySelector('#bubble')).toBeNull()
  })
})
