// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export const vitestBaseConfig = {
  test: {
    coverage: {
      provider: 'v8',
      include: ['packages/lynx-ui-common/src'],
      exclude: ['dist/**', 'types/**'],
      excludeAfterRemap: true,
      ignoreEmptyLines: true,
    },
    env: {
      RSPACK_HOT_TEST: 'true',
      DEBUG: 'rspeedy',
      UPDATE_SNAPSHOT:
        process.argv.includes('-u') || process.argv.includes('--update')
          ? 'true'
          : 'false',

      NO_COLOR: '1',
      FORCE_COLOR: '0',
      NODE_ENV: 'test',
    },

    pool: 'forks',

    poolOptions: {
      forks: {
        execArgv: ['--experimental-vm-modules', '--max-old-space-size=20480'],
      },
    },
    setupFiles: ['./tools/vitestSetup/setup.ts'],
  },
}

export default vitestBaseConfig
