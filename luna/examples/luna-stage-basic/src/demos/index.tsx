// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Stage, StageContainer } from '@lynx-js/luna-stage'
import { LynxStage } from '@lynx-js/luna-stage/lynx'

import './index.css'

const demos = ['PopoverBasic', 'SwitchBasic']

export default function Demo() {
  return (
    <div className='stage-outer-container'>
      {demos.map((demo) => (
        <StageContainer key={demo} className='stage-container'>
          <Stage className='stage'>
            <LynxStage entry={demo} />
          </Stage>
        </StageContainer>
      ))}
    </div>
  )
}
