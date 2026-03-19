// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Publishes each lynx-ui example variant as an npm package in the
 * `@lynx-example` scope so it can be consumed by the go-web `<Go>` component.
 *
 * Each variant (e.g. apps/examples/Button/Basic/) becomes its own package,
 * for example `@lynx-example/lynx-ui-button-basic`.
 *
 * Published package layout:
 *   Basic/          ← variant source files
 *   shared/         ← shared dirs (if any) from the component root
 *   dist/
 *     main.lynx.bundle
 *     main.web.bundle (if web build exists)
 *   package.json
 *
 * Prerequisites:
 *   pnpm examples:build   (builds all examples, producing dist/*.bundle files)
 *
 * Usage:
 *   node tools/scripts/publish-examples.mjs [--dry-run] [--tag <tag>] [--filter <Component> ...]
 *   pnpm examples:publish [-- --dry-run] [-- --filter Button --filter Form]
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const examplesRoot = path.join(repoRoot, 'apps/examples')

const dryRun = process.argv.includes('--dry-run')
const tagIdx = process.argv.indexOf('--tag')
const tag = tagIdx === -1 ? 'latest' : process.argv[tagIdx + 1]
const failFast = process.argv.includes('--fail-fast')

// Dirs to never copy into a published package
const IGNORE_DIRS = new Set(['node_modules', 'dist', '.rspeedy', '.turbo'])
const IGNORE_FILES = new Set(['.DS_Store'])

// Convert PascalCase/camelCase to kebab-case.
// e.g. PropagateTapEvent → propagate-tap-event, RTL → rtl
function toKebab(s) {
  return s
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

// Parse entry map from lynx.config.mjs via regex.
// Extracts lines matching:  EntryName: './VariantDir/index.tsx'
// Returns { EntryName: 'VariantDir', ... }
function parseEntries(configPath) {
  const src = fs.readFileSync(configPath, 'utf8')
  const entries = {}
  for (const m of src.matchAll(/(\w+):\s*['"]\.\/([^/'"]+)\/index\.tsx['"]/g)) {
    entries[m[1]] = m[2]
  }
  return entries
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src)) {
    if (IGNORE_DIRS.has(entry) || IGNORE_FILES.has(entry)) continue
    const srcPath = path.join(src, entry)
    const destPath = path.join(dest, entry)
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function runStdout(command, args, options = {}) {
  const result = spawnSync(command, args, { ...options, encoding: 'utf8' })
  if (result.error) throw result.error
  if (result.status !== 0) {
    const message = (result.stderr || '').toString().trim()
    throw new Error(
      message
        || `${command} ${args.join(' ')} failed with code ${result.status}`,
    )
  }
  return (result.stdout || '').toString()
}

// Version = 0.0.0-<short-commit-hash>.
// Every push to main gets a unique, commit-addressable version.
const commitHash = runStdout('git', ['rev-parse', '--short', 'HEAD']).trim()
const version = `0.0.0-${commitHash}`

// When --filter is passed, only publish the listed components.
// e.g. --filter Button --filter Form
const filterIdx = process.argv.reduce((acc, arg, i) => {
  if (arg === '--filter' && process.argv[i + 1]) acc.push(process.argv[i + 1])
  return acc
}, [])
const filterSet = filterIdx.length > 0 ? new Set(filterIdx) : null

const componentDirs = fs.readdirSync(examplesRoot).filter((name) => {
  if (filterSet && !filterSet.has(name)) return false
  const p = path.join(examplesRoot, name)
  return (
    fs.statSync(p).isDirectory()
    && fs.existsSync(path.join(p, 'lynx.config.mjs'))
  )
})

let published = 0
let skipped = 0
const failures = []

for (const component of componentDirs) {
  const componentDir = path.join(examplesRoot, component)
  const distDir = path.join(componentDir, 'dist')
  const entries = parseEntries(path.join(componentDir, 'lynx.config.mjs'))

  if (Object.keys(entries).length === 0) {
    console.warn(
      `[${component}] No entries found in lynx.config.mjs — skipping`,
    )
    continue
  }

  // Shared directories in the component root that are not variant source directories
  const entrySources = new Set(Object.values(entries))
  const sharedDirs = fs.readdirSync(componentDir).filter((name) => {
    const p = path.join(componentDir, name)
    return (
      fs.statSync(p).isDirectory()
      && !IGNORE_DIRS.has(name)
      && !entrySources.has(name)
    )
  })

  for (const [entryName, variantDir] of Object.entries(entries)) {
    const lynxBundle = path.join(distDir, `${entryName}.lynx.bundle`)

    if (!fs.existsSync(lynxBundle)) {
      console.warn(
        `  ⚠ ${entryName}: ${entryName}.lynx.bundle not found`
          + ` — run \`pnpm examples:build\` first`,
      )
      skipped++
      continue
    }

    const pkgName = `@lynx-example/lynx-ui-${toKebab(component)}-${
      toKebab(variantDir)
    }`
    const tmpDir = path.join(
      os.tmpdir(),
      'lynx-ui-publish-examples',
      pkgName.replace('@lynx-example/', ''),
    )

    // Clean and prepare tmp dir
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
    fs.mkdirSync(path.join(tmpDir, 'dist'), { recursive: true })

    // Copy variant source files
    copyDir(path.join(componentDir, variantDir), path.join(tmpDir, variantDir))

    // Copy shared/common dirs (e.g. shared/, Common/)
    for (const shared of sharedDirs) {
      copyDir(
        path.join(componentDir, shared),
        path.join(tmpDir, shared),
      )
    }

    // Copy bundles, renaming to main.lynx.bundle / main.web.bundle
    fs.copyFileSync(lynxBundle, path.join(tmpDir, 'dist', 'main.lynx.bundle'))
    const webBundle = path.join(distDir, `${entryName}.web.bundle`)
    if (fs.existsSync(webBundle)) {
      fs.copyFileSync(webBundle, path.join(tmpDir, 'dist', 'main.web.bundle'))
    }

    // Generate package.json
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify(
        {
          name: pkgName,
          version,
          license: 'Apache-2.0',
          repository: {
            type: 'git',
            url: 'git+https://github.com/lynx-family/lynx-ui.git',
            directory: `apps/examples/${component}/${variantDir}`,
          },
        },
        null,
        2,
      ),
    )

    if (dryRun) {
      console.log(`[dry-run] ${pkgName}@${version}`)
      published++
    } else {
      console.log(`Publishing ${pkgName}@${version} ...`)
      try {
        const result = spawnSync('npm', [
          'publish',
          '--access',
          'public',
          '--tag',
          tag,
        ], {
          cwd: tmpDir,
          stdio: 'inherit',
        })
        if (result.error) throw result.error
        if (result.status !== 0) {
          throw new Error(`npm publish failed with code ${result.status}`)
        }
        published++
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`  ✖ ${pkgName}: ${message}`)
        failures.push({
          component,
          entryName,
          variantDir,
          pkgName,
          message,
        })
        if (failFast) throw error
      }
    }
  }
}

if (failures.length > 0) {
  console.error('\nFailed package(s):')
  for (const f of failures) {
    console.error(
      `- ${f.pkgName} (${f.component}/${f.variantDir}): ${f.message}`,
    )
  }
  process.exitCode = 1
}

console.log(
  `\n${dryRun ? '[dry-run] ' : ''}${published} package(s) ${
    dryRun ? 'would be ' : ''
  }published, ${skipped} skipped, ${failures.length} failed.`,
)
