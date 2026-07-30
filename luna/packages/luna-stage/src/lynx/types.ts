// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { LynxViewElement as LynxView } from '@lynx-js/web-core/client'
import type { RefObject } from 'react'

type GlobalProps = Record<string, unknown>

export type ResolveBundleSrc = (params: {
  /** Normalized resource root, guaranteed to end with a trailing slash. */
  bundleRoot: string
  /** Bundle entry name provided by the host. */
  entry: string
}) => string

export interface UseLynxStageOptions {
  /**
   * Resource root used together with `entry` to locate the Lynx bundle.
   * The default resolver normalizes a trailing slash and builds
   * `${bundleRoot}${entry}.web.bundle`.
   */
  bundleRoot: string
  /**
   * Entry name for the Lynx bundle.
   */
  entry: string
  /**
   * Optional hook for overriding how the final bundle URL is resolved from
   * `bundleRoot` and `entry`.
   *
   * This callback is used to compute the resolved bundle URL during render.
   * If it changes identity and returns a different URL, the hook treats that as
   * a bundle change because `src` changed. The resolver always receives a
   * normalized `bundleRoot` ending with `/`.
   */
  resolveBundleSrc?: ResolveBundleSrc
  /**
   * Global props to inject into the Lynx runtime via `updateGlobalProps`.
   * Re-injected whenever the object reference changes.
   */
  globalProps?: GlobalProps
  /**
   * Called when the Lynx runtime calls a native module.
   * Return a value to send back to the runtime.
   *
   * Treated as non-reactive: the latest handler is used without re-running
   * effects when the function identity changes.
   */
  onNativeModulesCall?: (
    name: string,
    data: unknown,
    moduleName: string,
  ) => unknown
  /**
   * Called once when the view has rendered successfully.
   *
   * Treated as non-reactive: the latest handler is used without re-running
   * effects when the function identity changes.
   */
  onReady?: () => void
  /**
   * Called when an error occurs during runtime load, template fetch, or rendering.
   *
   * Treated as non-reactive: the latest handler is used without re-running
   * effects when the function identity changes.
   */
  onError?: (error: string) => void
}

export interface UseLynxStageResult {
  /** Attach to the `<lynx-view>` element. */
  lynxViewRef: RefObject<LynxView>
  /** Attach to the container `<div>` wrapping `<lynx-view>`. */
  containerRef: RefObject<HTMLDivElement>
  /**
   * Resolved bundle URL for the current `entry`/`bundleRoot`.
   * Pass this value to `<lynx-view url={src} />` so the URL is available
   * at element creation time (avoids ref/effect timing races).
   */
  src: string
  /**
   * Whether the Lynx runtime (`@lynx-js/web-core/client`) has finished loading.
   * When `false`, delay mounting `<lynx-view>` to avoid upgrade/handshake races.
   */
  ready: boolean
}
