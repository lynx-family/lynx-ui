// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { vitestTestingLibraryPlugin } from '@lynx-js/react/testing-library/plugins'
import type { TestingLibraryOptions } from '@lynx-js/react/testing-library/plugins'
import { defineConfig, mergeConfig } from 'vitest/config'
import type { UserConfig } from 'vitest/config'

const PACKAGES_DIR = fileURLToPath(new URL('../../packages', import.meta.url))

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

interface WorkspacePackageManifest {
  name?: string
  'jsnext:source'?: string
}

function getWorkspacePackageAliases(): Array<{
  find: RegExp
  replacement: string
}> {
  const aliases: Array<{ find: RegExp, replacement: string }> = []
  for (const entry of fs.readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith('lynx-ui')) {
      continue
    }
    const pkgDir = path.join(PACKAGES_DIR, entry.name)
    const pkgJsonPath = path.join(pkgDir, 'package.json')
    if (!fs.existsSync(pkgJsonPath)) {
      continue
    }
    const pkg = JSON.parse(
      fs.readFileSync(pkgJsonPath, 'utf8'),
    ) as WorkspacePackageManifest
    if (pkg.name && pkg['jsnext:source']) {
      const sourceEntry = path.resolve(pkgDir, pkg['jsnext:source'])
      if (fs.existsSync(sourceEntry)) {
        aliases.push({
          find: new RegExp(`^${escapeRegExp(pkg.name)}$`),
          replacement: sourceEntry,
        })
      }
    }
  }
  return aliases
}

export interface VitestBaseConfigOptions {
  root: string
  name: string
  include?: string[]
  pluginOptions?: TestingLibraryOptions
  config?: UserConfig
}

export function vitestBaseConfig(
  options: VitestBaseConfigOptions,
): UserConfig {
  const {
    root,
    name,
    include = ['__tests__/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    pluginOptions,
    config,
  } = options

  const baseConfig: UserConfig = defineConfig({
    root,
    plugins: [vitestTestingLibraryPlugin(pluginOptions)],
    resolve: {
      alias: getWorkspacePackageAliases(),
    },
    test: {
      name,
      include,
    },
  })

  return config ? mergeConfig(baseConfig, config) : baseConfig
}

export default vitestBaseConfig
