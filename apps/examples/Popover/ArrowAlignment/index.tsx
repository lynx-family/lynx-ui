// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root, useState } from '@lynx-js/react'

import {
  Button,
  PopoverArrow,
  PopoverContent,
  PopoverPositioner,
  PopoverRoot,
  PopoverTrigger,
} from '@lynx-js/lynx-ui'
import { clsx } from 'clsx'

import './index.css'

const sides = ['bottom', 'top', 'left', 'right'] as const
const cases = ['rounded corner', 'narrow wrapper', 'matching wrapper'] as const

// A wide, downward-pointing curve makes corner clearance easy to compare.
// PopoverArrow rotates this custom child for the other placements.
const arrowSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="11" viewBox="0 0 32 11"><path d="M0 0H32C24 0 21 11 16 11C11 11 8 0 0 0Z" fill="#69d8c9"/></svg>'
const paddings = [null, 0, 16, 27] as const
const arrowSizes = [{ width: 32, height: 11 }, 11, 32] as const
const sizeLabels = ['32 × 11', '11 (legacy)', '32 (legacy)'] as const

function App() {
  const [caseIndex, setCaseIndex] = useState(0)
  const [sideIndex, setSideIndex] = useState(0)
  const [directArrow, setDirectArrow] = useState(false)
  const [revision, setRevision] = useState(0)
  const [paddingIndex, setPaddingIndex] = useState(0)
  const [radius, setRadius] = useState(8)
  const [sizeIndex, setSizeIndex] = useState(0)
  const corner = caseIndex === 0
  const narrow = caseIndex === 1
  const side = corner ? 'bottom' : sides[sideIndex]
  const horizontal = side === 'left' || side === 'right'
  const placement = corner ? 'bottom-start' : side
  const nested = !corner && !directArrow
  const padding = corner ? paddings[paddingIndex] ?? radius : 0
  const arrow = (
    <PopoverArrow
      className='popover-arrow'
      size={arrowSizes[sizeIndex]}
      offset={padding}
    >
      <svg
        id='arrow-svg'
        className='arrow-svg'
        content={arrowSvg}
        overlap={false}
      />
    </PopoverArrow>
  )

  return (
    <view className='demo-container luna-dark'>
      <text className='title'>Arrow alignment</text>
      <text className='hint'>
        Bubble: {corner ? '216 × 80' : (horizontal ? '120 × 180' : '240 × 80')}
        {' '}
        · Artwork: 32 × 11
      </text>
      <text className='hint'>
        {typeof SystemInfo === 'undefined'
          ? 'Native geometry probe'
          : `${SystemInfo.platform} · Lynx ${SystemInfo.engineVersion}`}
      </text>
      <view className='controls'>
        <Button
          className='control'
          onClick={() => setCaseIndex((value) => (value + 1) % cases.length)}
        >
          <text className='control-label'>Case: {cases[caseIndex]}</text>
        </Button>
        <Button
          className='control'
          onClick={() =>
            corner
              ? setPaddingIndex((value) => (value + 1) % paddings.length)
              : setDirectArrow((value) => !value)}
        >
          <text className='control-label'>
            {corner
              ? `Padding: ${
                paddings[paddingIndex] === null
                  ? `R (${radius}px)`
                  : `${padding}px`
              }`
              : `Parent: ${directArrow ? 'bubble' : 'wrapper'}`}
          </text>
        </Button>
      </view>
      <view className='controls'>
        <Button
          className='control'
          onClick={() =>
            setSizeIndex((value) => (value + 1) % arrowSizes.length)}
        >
          <text className='control-label'>Size: {sizeLabels[sizeIndex]}</text>
        </Button>
        {corner && (
          <Button
            className='control'
            onClick={() => setRadius((value) => value === 8 ? 16 : 8)}
          >
            <text className='control-label'>Radius: {radius}px</text>
          </Button>
        )}
      </view>
      <view className='controls'>
        <Button
          className='control'
          disabled={corner}
          onClick={() => setSideIndex((value) => (value + 1) % sides.length)}
        >
          <text className='control-label'>Placement: {placement}</text>
        </Button>
        <Button
          className='control'
          onClick={() => setRevision((value) => value + 1)}
        >
          <text className='control-label'>Reopen</text>
        </Button>
      </view>
      <view className={clsx('stage', { 'stage-corner': corner })}>
        {/* Remount each configuration to measure its anchor and bubble again. */}
        <PopoverRoot
          key={`${caseIndex}-${side}-${directArrow}-${padding}-${radius}-${sizeIndex}-${revision}`}
          show={true}
        >
          <PopoverTrigger
            className={clsx('trigger', { 'trigger-small': corner })}
          >
            <view
              id='anchor-marker'
              className={clsx('anchor-marker', { 'trigger-small': corner })}
            />
            <PopoverPositioner
              placement={placement}
              placementOffset={8}
              className='popover-positioner'
            >
              <PopoverContent
                className={clsx('bubble', {
                  'bubble-horizontal': horizontal,
                  'bubble-tooltip': corner,
                })}
                style={corner ? { borderRadius: `${radius}px` } : undefined}
                popoverContentProps={{ id: 'bubble' }}
              >
                <view
                  id='inner-wrapper'
                  className={clsx('inner-wrapper', {
                    'inner-narrow': narrow && !horizontal,
                    'inner-short': narrow && horizontal,
                  })}
                >
                  <text className='bubble-label'>Content</text>
                  {nested ? arrow : null}
                </view>
                {nested ? null : arrow}
              </PopoverContent>
            </PopoverPositioner>
          </PopoverTrigger>
        </PopoverRoot>
      </view>
      <text className='hint'>
        {corner
          ? 'Use size 32 × 11 and padding R to clear the corner. Compare legacy sizes and padding 0.'
          : 'The arrow should point toward the white anchor. Compare a nested arrow with a direct child of the bubble.'}
      </text>
    </view>
  )
}

root.render(<App />)
export default App
