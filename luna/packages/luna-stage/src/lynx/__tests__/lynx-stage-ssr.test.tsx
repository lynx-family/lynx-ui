// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// @vitest-environment node

import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { LunaLynxStage } from '../luna-lynx-stage'
import { LynxStage } from '../lynx-stage'

// Mock the web-core runtime to avoid actual loading and network requests in tests
vi.mock('@lynx-js/web-core/client', () => ({
  default: {},
}))

describe('LynxStage SSR Behavior', () => {
  it('should render null on the server side (SSR) without throwing', () => {
    // We simulate SSR using react-dom/server's renderToString in a Node environment
    // where window and document are undefined.
    // In SSR, the client-only guard should evaluate to false, so the component renders null.
    let html = ''
    expect(() => {
      html = renderToString(
        <LynxStage entry='test-entry' bundleRoot='/' />,
      )
    }).not.toThrow()

    // The SSR guard should return null (empty string in HTML)
    expect(html).toBe('')
  })
})

describe('LunaLynxStage SSR Behavior', () => {
  it('should render null on the server side (SSR) without throwing', () => {
    let html = ''
    expect(() => {
      html = renderToString(
        <LunaLynxStage
          entry='test-entry'
          bundleRoot='/'
          lunaTheme='luna-light'
        />,
      )
    }).not.toThrow()

    expect(html).toBe('')
  })
})
