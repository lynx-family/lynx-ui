// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type LynxViewAttributes = HTMLAttributes<HTMLElement> & {
  url?: string
  'lynx-group-id'?: number
  'transform-vh'?: boolean
  'transform-vw'?: boolean
}

declare global {
  // biome-ignore lint/style/noNamespace: JSX intrinsic element augmentation uses the JSX namespace.
  namespace JSX {
    interface IntrinsicElements {
      'lynx-view': DetailedHTMLProps<LynxViewAttributes, HTMLElement>
    }
  }
}

export type CSSVarProperties = Record<`--${string}`, string | number>
export type LynxGlobalProps = Record<string, unknown>
