// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { root } from '@lynx-js/react'

import {
  Box,
  Column,
  Container,
  Flex,
  Grid,
  Row,
  Section,
} from '@lynx-js/lynx-ui'

import './index.css'

function App() {
  return (
    <Container size='1' p='4' className='demo-container luna-light'>
      <Section size='1'>
        <Column gap='5'>
          <Row align='center' justify='between' gap='3'>
            <text className='title'>Your workspace</text>
            <Box p='2' className='status'>
              <text className='caption'>Ready</text>
            </Box>
          </Row>
          <Grid columns='2' gap='3'>
            <Box p='4' className='card'>
              <Column gap='2'>
                <text className='metric'>12</text>
                <text className='caption'>Projects</text>
              </Column>
            </Box>
            <Box p='4' className='card'>
              <Column gap='2'>
                <text className='metric'>4</text>
                <text className='caption'>Teams</text>
              </Column>
            </Box>
          </Grid>
          <Flex direction='row' wrap='wrap' gapX='2' gapY='3'>
            {['Design', 'Development', 'Planning'].map(label => (
              <Box key={label} px='3' py='2' className='tag'>
                <text className='caption'>{label}</text>
              </Box>
            ))}
          </Flex>
        </Column>
      </Section>
    </Container>
  )
}

root.render(<App />)
export default App
