// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { getPackages } from '@manypkg/get-packages'
import invariant from 'tiny-invariant'

/**
 * Apply snapshot versions to all packages
 *
 * @returns {Promise<void>}
 */
export async function runSnapshot() {
  const { packages } = await getPackages(process.cwd())

  const packageVersions = new Map(
    packages.map((
      x,
    ) => [x.packageJson.name, buildVersion(x.packageJson.version)]),
  )

  await Promise.all(
    packages
      .filter(pkg => pkg.packageJson.private !== true)
      .map(
        async (pkg) => {
          pkg.packageJson.name = buildCanaryPackageName(pkg.packageJson.name)
          pkg.packageJson.version = buildVersion(pkg.packageJson.version)

          if (pkg.packageJson.dependencies) {
            updateDependencies(packageVersions, pkg.packageJson.dependencies)
          }
          if (pkg.packageJson.peerDependencies) {
            updatePeerDependencies(
              packageVersions,
              pkg.packageJson.peerDependencies,
            )
          }

          const packageJsonPath = path.join(pkg.dir, 'package.json')

          await writeFile(
            packageJsonPath,
            JSON.stringify(
              pkg.packageJson,
              null,
              2,
            ) + os.EOL,
          )
        },
      ),
  )

  return
}

/**
 * Update dependencies to workspace packages to the workspace version.
 *
 * @param {Map<string, string>} packageVersions - A Map from name to version
 * @param {Record<string, string>} dependencies - `package.json#dependencies`
 */
function updateDependencies(packageVersions, dependencies) {
  Object.keys(dependencies).forEach(
    (name) => {
      if (packageVersions.has(name)) {
        const newVersion = packageVersions.get(name)
        invariant(newVersion)
        dependencies[name] = `npm:${buildCanaryPackageName(name)}@${newVersion}`
      }
    },
  )
}

/**
 * Update peerDependencies of workspace package to `*`
 *
 * @param {Map<string, string>} packageVersions - A Map from name to version
 * @param {Record<string, string>} peerDependencies - `package.json#peerDependencies`
 */
function updatePeerDependencies(packageVersions, peerDependencies) {
  Object.keys(peerDependencies).forEach(
    (name) => {
      if (packageVersions.has(name)) {
        peerDependencies[name] = '*'
      }
    },
  )
}

/**
 * @param {string} name - The package name
 * @returns {string} The canary package name
 */
function buildCanaryPackageName(name) {
  return `${name}-canary`
}

/**
 * @param {string} version - The original package version.
 * @returns {string} - Return the formatted version.
 */
function buildVersion(version) {
  const [v, tag, date, commitHash, ...others] = version.split('-')
  if (v && tag && date && commitHash) {
    // `version` is a snapshot version
    return [
      v,
      tag,
      date.substring(0, 'yyyymmdd'.length),
      commitHash.substring(0, 8),
      ...others,
    ].join('-')
  }

  return version
}

await runSnapshot()
