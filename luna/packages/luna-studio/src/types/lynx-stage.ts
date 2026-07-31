// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { LunaLynxStageProps } from '@lynx-js/luna-stage/lynx'

import type { Prettify } from './utils'

/**
 * Generic runtime callback payload emitted from Lynx back into the host Web app.
 */
export interface LynxRuntimeCall {
  /** Lynx bundle entry that emitted the runtime call. */
  entry: string
  /** Runtime channel name, derived from the low-level native-module source. */
  channel: string
  /** Runtime event name within the channel. */
  name: string
  /** Opaque payload forwarded from the Lynx runtime. */
  data: unknown
}

export type StudioLynxStageProps = Prettify<
  & Omit<LunaLynxStageProps, 'onNativeModulesCall'>
  & {
    /** Receives runtime calls emitted from the embedded Lynx content. */
    onLynxRuntimeCall?: (call: LynxRuntimeCall) => unknown
  }
>
