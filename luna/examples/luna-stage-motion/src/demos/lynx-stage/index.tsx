// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { LynxStage } from '@lynx-js/luna-stage/lynx'
import {
  MotionPresentation,
  MotionStage,
  MotionStageContainer,
} from '@lynx-js/luna-stage/motion'
import { AnimatePresence } from 'motion/react'
import { useMemo, useState } from 'react'

import '../index.css'

const variants = {
  initial: { opacity: 0, x: -300 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 300 },
}

export default function Demo() {
  const [enabled, setEnabled] = useState(true)
  const [depth, setDepth] = useState(0)
  const [offsetX, setOffsetX] = useState(0)

  const world = useMemo(() => ({ x: offsetX, y: 0, z: depth }), [
    offsetX,
    depth,
  ])

  return (
    <div className='stage-grid'>
      <div className='controls'>
        <button
          type='button'
          className='button'
          onClick={() => setEnabled(v => !v)}
        >
          {enabled ? 'Hide' : 'Show'}
        </button>

        <label className='label'>
          X
          <input
            className='range'
            type='range'
            min={-120}
            max={120}
            value={offsetX}
            onChange={e => setOffsetX(Number(e.target.value))}
          />
        </label>

        <label className='label'>
          Z
          <input
            className='range'
            type='range'
            min={-300}
            max={300}
            value={depth}
            onChange={e => setDepth(Number(e.target.value))}
          />
        </label>
      </div>

      <div className='stage-cell'>
        <AnimatePresence mode='popLayout'>
          {enabled
            ? (
              <MotionStageContainer className='stage-container' layoutId='demo'>
                <MotionPresentation
                  variants={variants}
                  initial='initial'
                  animate='animate'
                  exit='exit'
                >
                  <MotionStage
                    baseWidth={375}
                    baseHeight={812}
                    style={{ backgroundColor: 'rgb(255 255 255 / 0.13)' }}
                    world={world}
                    focalLength={500}
                    fit='contain'
                    zoom={1}
                  >
                    <LynxStage entry='gooey_effect' />
                  </MotionStage>
                </MotionPresentation>
              </MotionStageContainer>
            )
            : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
