// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
// Copyright 2024 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { getPackages } from '@manypkg/get-packages'
import invariant from 'tiny-invariant'

/**
 * Apply snapshot versions to all packages
 *
 * @returns {Promise<void>}
 */
export async function runSnapshot() {
  const { packages } = await getPackages(process.cwd())

  const identifier = (process.env.CI_COMMIT_SHA || 'local').slice(0, 7)
  console.log(`[snapshot] Using stable identifier: ${identifier}`)

  const packageVersions = new Map()
  for (const pkg of packages) {
    const stabilizedVersion = buildVersion(pkg.packageJson.version, identifier)
    packageVersions.set(pkg.packageJson.name, stabilizedVersion)
    if (pkg.packageJson.version !== stabilizedVersion) {
      console.log(
        `[snapshot] Stabilizing ${pkg.packageJson.name}: ${pkg.packageJson.version} -> ${stabilizedVersion}`,
      )
    }
  }

  await Promise.all(
    packages
      .filter((pkg) => pkg.packageJson.private !== true)
      .map(async (pkg) => {
        const originalName = pkg.packageJson.name
        const newName = buildCanaryPackageName(pkg.packageJson.name)
        const newVersion = packageVersions.get(originalName)

        console.log(
          `[snapshot] Updating ${originalName} to ${newName}@${newVersion}`,
        )

        pkg.packageJson.name = newName
        pkg.packageJson.version = newVersion

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
          JSON.stringify(pkg.packageJson, null, 2) + os.EOL,
        )
      }),
  )
}

/**
 * Update dependencies to workspace packages to the workspace version.
 *
 * @param {Map<string, string>} packageVersions - A Map from name to version
 * @param {Record<string, string>} dependencies - `package.json#dependencies`
 */
function updateDependencies(packageVersions, dependencies) {
  Object.keys(dependencies).forEach((name) => {
    if (packageVersions.has(name)) {
      const newVersion = packageVersions.get(name)
      invariant(newVersion)
      dependencies[name] = `npm:${buildCanaryPackageName(name)}@${newVersion}`
    }
  })
}

/**
 * Update peerDependencies of workspace package to `*`
 *
 * @param {Map<string, string>} packageVersions - A Map from name to version
 * @param {Record<string, string>} peerDependencies - `package.json#peerDependencies`
 */
function updatePeerDependencies(packageVersions, peerDependencies) {
  Object.keys(peerDependencies).forEach((name) => {
    if (packageVersions.has(name)) {
      peerDependencies[name] = '*'
    }
  })
}

/**
 * @param {string} name - The package name
 * @returns {string} The canary package name
 */
export function buildCanaryPackageName(name) {
  return `${name}-canary`
}

/**
 * @param {string} version - The original package version.
 * @param {string} identifier - The stable identifier.
 * @returns {string} - Return the formatted version.
 */
export function buildVersion(version, identifier) {
  const snapshotRegex = /([-.])\d{10,}$/
  if (snapshotRegex.test(version)) {
    return version.replace(
      snapshotRegex,
      (match, prefix) => prefix + identifier,
    )
  }

  const parts = version.split('-')
  if (parts.length >= 3) {
    // `version` is a snapshot version: [v, tag, date, ...others]
    parts[parts.length - 1] = identifier
    return parts.join('-')
  }

  if (process.env.FORCE_SNAPSHOT) {
    return `${version}-${identifier}`
  }

  return version
}

if (
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await runSnapshot()
}
