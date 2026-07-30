// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { act } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { LunaLynxStage } from '../luna-lynx-stage'
import { LynxStage } from '../lynx-stage'

// Mock the web-core runtime to avoid actual loading and network requests in tests
vi.mock('@lynx-js/web-core/client', () => {
  if (
    typeof customElements !== 'undefined' && !customElements.get('lynx-view')
  ) {
    customElements.define(
      'lynx-view',
      class LynxViewMock extends HTMLElement {
        updateGlobalProps = vi.fn()
      },
    )
  }
  return { default: {} }
})

describe('LynxStage Client Mounting Behavior', () => {
  it('should mount correctly on the client side after useIsClient resolves', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    // Seed the container with initial markup.
    // This test primarily verifies client-side mounting after `useIsClient` resolves.
    const serverMarkup = renderToString(
      <LynxStage entry='test-entry' bundleRoot='/' />,
    )
    container.innerHTML = serverMarkup

    // Hydrate the markup
    let root: Root | undefined

    // We need to wait for the effects to run after hydration
    await act(async () => {
      root = hydrateRoot(
        container,
        <LynxStage entry='test-entry' bundleRoot='/' />,
      )
      // await Promise.resolve() satisfies the async requirement and yields a microtask
      await Promise.resolve()
    })

    // useIsClient flips to true after hydration — lynx-view should now be present
    // Flush the remaining React state updates (useSyncExternalStore / useEffect)
    await act(async () => {
      await Promise.resolve()
    })

    // After hydration and effects run, the component should mount the lynx-view
    const lynxView = container.querySelector('lynx-view')
    expect(lynxView).not.toBeNull()

    // Verify that the wrapper div has the ref and container styles
    const wrapperDiv = container.firstElementChild as HTMLElement
    expect(wrapperDiv.tagName.toLowerCase()).toBe('div')
    expect(wrapperDiv.style.position).toBe('relative')
    expect(wrapperDiv.style.width).toBe('100%')
    expect(wrapperDiv.style.height).toBe('100%')

    // Cleanup
    if (root) {
      root.unmount()
    }
    document.body.removeChild(container)
  })
})

describe('LunaLynxStage Client Mounting Behavior', () => {
  it('should mount correctly on the client side after useIsClient resolves', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    // Seed the container with initial markup.
    // This test primarily verifies client-side mounting after `useIsClient` resolves.
    const serverMarkup = renderToString(
      <LunaLynxStage
        entry='test-entry'
        bundleRoot='/'
        lunaTheme='lunaris-dark'
      />,
    )
    container.innerHTML = serverMarkup

    // Hydrate the markup
    let root: Root | undefined
    await act(async () => {
      root = hydrateRoot(
        container,
        <LunaLynxStage
          entry='test-entry'
          bundleRoot='/'
          lunaTheme='lunaris-dark'
        />,
      )
      await Promise.resolve()
    })

    // useIsClient flips to true after hydration — lynx-view should now be present
    // Flush the remaining React state updates (useSyncExternalStore / useEffect)
    await act(async () => {
      await Promise.resolve()
    })

    // After hydration and effects run, the component should mount the lynx-view
    const lynxView = container.querySelector('lynx-view')
    expect(lynxView).not.toBeNull()

    // Cleanup
    if (root) {
      root.unmount()
    }
    document.body.removeChild(container)
  })
})
