// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createContext } from '@lynx-js/react'

export type PopoverAnimationDriver = (
  animation: { open: boolean, complete: () => void },
) => (() => void) | undefined

export const PopoverAnimationContext = createContext<
  ((driver: PopoverAnimationDriver) => () => void) | null
>(null)

export const PopoverGeometryContext = createContext('50% 50%')
