// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Stage, StageContainer } from '@lynx-js/luna-stage'
import { LynxStage } from '@lynx-js/luna-stage/lynx'

import { Container } from '../container'
import { StudioFrame } from '../studio-frame'

const lightTheme = { lunaTheme: 'luna-light' }
const darkTheme = { lunaTheme: 'luna-dark' }

function StudioStatic() {
  return (
    <StudioFrame className={'py-10 bg-[#f5f5f5]'}>
      <Container
        className={'gap-4 pointer-events-none'}
      >
        <StageContainer className='flex-1 pointer-events-none'>
          <Stage className='bg-black opacity-10'>
            <LynxStage
              entry='ActOne'
              globalProps={darkTheme}
            />
          </Stage>
        </StageContainer>
        <StageContainer className='flex-1'>
          <Stage className='bg-white opacity-50'>
            <LynxStage
              entry='ActOne'
              globalProps={lightTheme}
            />
          </Stage>
        </StageContainer>
        <StageContainer className='flex-1'>
          <Stage className='bg-black opacity-10'>
            <LynxStage
              entry='ActTwo'
              globalProps={darkTheme}
            />
          </Stage>
        </StageContainer>
        <StageContainer className='flex-1'>
          <Stage className='bg-white opacity-50'>
            <LynxStage
              entry='ActTwo'
              globalProps={lightTheme}
            />
          </Stage>
        </StageContainer>
      </Container>
    </StudioFrame>
  )
}

export { StudioStatic }
