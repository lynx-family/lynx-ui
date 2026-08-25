// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createLunaPreset } from '@lynx-js/luna-tailwind'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx,mdx}'],
  presets: [createLunaPreset({ leafPreset: false })],
}

export default config
