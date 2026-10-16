// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import '@testing-library/jest-dom'

import { PresenceState } from '@lynx-js/lynx-ui-presence'
import { act, render } from '@lynx-js/react/testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  PopoverAnchor,
  PopoverArrow,
  PopoverBackdrop,
  PopoverContent,
  PopoverContext,
  PopoverPositioner,
  PopoverTrigger,
} from '../src'
import { computeFloating } from '../src/floating'
import type { Placement } from '../src/floating'
import type { PopoverContextType } from '../src/types'

vi.mock('../src/floating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/floating')>()
  return {
    ...actual,
    computeFloating: vi.fn(),
  }
})

const placementCases: Array<{
  placement: Placement
  side: string
  align: string
}> = [
  { placement: 'top', side: 'top', align: 'center' },
  { placement: 'top-start', side: 'top', align: 'start' },
  { placement: 'top-end', side: 'top', align: 'end' },
  { placement: 'right', side: 'right', align: 'center' },
  { placement: 'right-start', side: 'right', align: 'start' },
  { placement: 'right-end', side: 'right', align: 'end' },
  { placement: 'bottom', side: 'bottom', align: 'center' },
  { placement: 'bottom-start', side: 'bottom', align: 'start' },
  { placement: 'bottom-end', side: 'bottom', align: 'end' },
  { placement: 'left', side: 'left', align: 'center' },
  { placement: 'left-start', side: 'left', align: 'start' },
  { placement: 'left-end', side: 'left', align: 'end' },
]

const sharedInfo: PopoverContextType['sharedInfo'] = {
  reference: { x: 0, y: 0, width: 20, height: 20 },
  floating: { x: 0, y: 0, width: 100, height: 60 },
  arrow: {
    coords: { x: 10, y: 10 },
    offset: 0,
    size: 8,
  },
  floatingCoords: { x: 0, y: 0 },
}

function renderPopover(
  placement: Placement,
  options: {
    state?: PresenceState
    transition?: boolean
    includeUnaffectedNodes?: boolean
  } = {},
) {
  const {
    state = PresenceState.DelayedEntering,
    transition = false,
    includeUnaffectedNodes = false,
  } = options
  const contextValue: PopoverContextType = {
    sharedInfo,
    updateRects: vi.fn(),
    show: true,
    forceMount: true,
    setUncontrolledShow: vi.fn(),
    hasAnchor: false,
    setHasAnchor: vi.fn(),
    state,
    setPresenceState: vi.fn(),
  }

  return (
    <PopoverContext.Provider value={contextValue}>
      {includeUnaffectedNodes && (
        <>
          <PopoverTrigger className='trigger-consumer'>
            <text>Trigger</text>
          </PopoverTrigger>
          <PopoverAnchor className='anchor-consumer'>
            <text>Anchor</text>
          </PopoverAnchor>
          <PopoverBackdrop className='backdrop-consumer' />
        </>
      )}
      <PopoverPositioner
        placement={placement}
        className='positioner-consumer'
        transition={transition}
      >
        <PopoverContent className='content-consumer' transition={transition}>
          <text>Content</text>
        </PopoverContent>
        <PopoverArrow
          className='arrow-consumer'
          size={8}
          transition={transition}
        />
      </PopoverPositioner>
    </PopoverContext.Provider>
  )
}

function getPositionedNodes(container: Element) {
  return [
    container.querySelector('.positioner-consumer')!,
    container.querySelector('.content-consumer')!,
    container.querySelector('.arrow-consumer')!,
  ]
}

function resolvedResult(placement: Placement) {
  return {
    x: 0,
    y: 0,
    placement,
    strategy: 'absolute' as const,
    middlewareData: {
      arrow: { x: 10, y: 10, centerOffset: 0 },
    },
  }
}

beforeEach(() => {
  Object.assign(lynx, {
    requestAnimationFrame: vi.fn(),
  })
  vi.mocked(computeFloating).mockReset()
  vi.mocked(computeFloating).mockImplementation(({ placement = 'bottom' }) =>
    Promise.resolve(resolvedResult(placement))
  )
})

describe('Popover placement UI variants', () => {
  it.each(placementCases)(
    'maps $placement to ui-side-$side and ui-align-$align on positioned nodes',
    ({ placement, side, align }) => {
      const { container } = render(renderPopover(placement))

      for (const node of getPositionedNodes(container)) {
        expect(node).toHaveClass(`ui-side-${side}`, `ui-align-${align}`)
      }
    },
  )

  it('preserves consumer and presence classes on positioned nodes', () => {
    const { container } = render(renderPopover('bottom-end', {
      transition: true,
    }))

    for (const node of getPositionedNodes(container)) {
      expect(node).toHaveClass(
        'ui-side-bottom',
        'ui-align-end',
        'ui-open',
        'ui-entering',
        'ui-animating',
      )
    }
    expect(container.querySelector('.positioner-consumer')).toHaveClass(
      'positioner-consumer',
    )
    expect(container.querySelector('.content-consumer')).toHaveClass(
      'content-consumer',
    )
    expect(container.querySelector('.arrow-consumer')).toHaveClass(
      'arrow-consumer',
    )
  })

  it('preserves closed, leaving, and animating presence classes', () => {
    const { container } = render(renderPopover('left', {
      state: PresenceState.Leaving,
      transition: true,
    }))

    for (const node of getPositionedNodes(container)) {
      expect(node).toHaveClass(
        'ui-side-left',
        'ui-align-center',
        'ui-closed',
        'ui-leaving',
        'ui-animating',
      )
    }
  })

  it('removes stale classes when the placement prop changes', () => {
    const { container, rerender } = render(renderPopover('top-start'))

    rerender(renderPopover('left-end'))

    for (const node of getPositionedNodes(container)) {
      expect(node).toHaveClass('ui-side-left', 'ui-align-end')
      expect(node).not.toHaveClass('ui-side-top', 'ui-align-start')
    }
  })

  it('uses the resolved placement returned by floating layout', async () => {
    vi.mocked(computeFloating).mockResolvedValue(resolvedResult('right-end'))
    const { container } = render(renderPopover('top-start'))

    await act(async () => {
      await Promise.resolve()
    })

    for (const node of getPositionedNodes(container)) {
      expect(node).toHaveClass('ui-side-right', 'ui-align-end')
      expect(node).not.toHaveClass('ui-side-top', 'ui-align-start')
    }
  })

  it('does not apply placement classes to trigger, anchor, or backdrop', () => {
    const { container } = render(renderPopover('bottom-end', {
      includeUnaffectedNodes: true,
    }))

    for (
      const node of [
        container.querySelector('.trigger-consumer')!,
        container.querySelector('.anchor-consumer')!,
        container.querySelector('.backdrop-consumer')!,
      ]
    ) {
      expect(node.className).not.toMatch(/\bui-(?:side|align)-/)
    }
  })
})
