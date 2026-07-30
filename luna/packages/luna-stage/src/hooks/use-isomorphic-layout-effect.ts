// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useEffect, useLayoutEffect } from 'react'

const isServer = typeof window === 'undefined'
  || typeof document === 'undefined'

// Fix: server → useEffect (no-op, avoids SSR warning);
//      client → useLayoutEffect (synchronous layout measurements).
const useIsomorphicLayoutEffect: typeof useEffect = isServer
  ? useEffect
  : useLayoutEffect

export { useIsomorphicLayoutEffect }
