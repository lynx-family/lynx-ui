// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineConfig } from 'vitest/config'

// Run main-thread controller logic without the component compiler's BTS stubs.
export default defineConfig({
  root: import.meta.dirname,
  esbuild: { jsx: 'automatic', jsxImportSource: '@lynx-js/react' },
  test: { name: 'popover-motion-controller', include: ['*.test.ts'] },
})
