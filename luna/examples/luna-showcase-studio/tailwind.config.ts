// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import headlessUIPlugin from '@headlessui/tailwindcss'
import type { Config } from 'tailwindcss'
import type { PluginCreator } from 'tailwindcss/types/config'

const config: Config = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx,mdx}'],
  plugins: [headlessUIPlugin as PluginCreator],
}
export default config
