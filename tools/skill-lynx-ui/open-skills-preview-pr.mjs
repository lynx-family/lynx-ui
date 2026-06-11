// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { execFileSync, spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const defaultConfig = {
  baseBranch: 'main',
  evalSlug: 'lynx-ui',
  packageName: '@lynx-js/skill-lynx-ui',
  targetRepo: 'lynx-community/skills',
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const packageName = args.packageName ?? defaultConfig.packageName
  const targetRepo = args.targetRepo ?? defaultConfig.targetRepo
  const baseBranch = args.baseBranch ?? defaultConfig.baseBranch
  const evalSlug = args.evalSlug ?? defaultConfig.evalSlug
  const sourcePr = requiredArg(args.sourcePr, '--source-pr')
  const sourceSha = requiredArg(args.sourceSha, '--source-sha')
  const metadataPath = requiredArg(args.metadata, '--metadata')
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN

  if (!hasPackageChangeset(packageName)) {
    console.info(
      `No ${packageName} changeset found; skipping skills preview PR.`,
    )
    return
  }

  if (!token) {
    console.info(
      'Missing GH_TOKEN/GITHUB_TOKEN for lynx-community/skills; skipping skills preview PR.',
    )
    return
  }

  const previewUrl = findPreviewUrl(metadataPath, packageName)
  const branchName = `preview/skill-lynx-ui/pr-${sourcePr}`
  const title = `test: validate skill-lynx-ui preview from lynx-ui#${sourcePr}`
  const tempRoot = mkdtempSync(path.join(tmpdir(), 'lynx-ui-skills-preview-'))

  try {
    const skillsDir = path.join(tempRoot, 'skills')
    const authenticatedRepoUrl =
      `https://x-access-token:${token}@github.com/${targetRepo}.git`

    run('git', [
      'clone',
      '--depth=1',
      '--branch',
      baseBranch,
      authenticatedRepoUrl,
      skillsDir,
    ], {
      cwd: tempRoot,
    })
    run('git', ['checkout', '-B', branchName], { cwd: skillsDir })
    run('corepack', ['enable'], { cwd: skillsDir })
    run('pnpm', ['install', '--frozen-lockfile'], { cwd: skillsDir })
    run('pnpm', ['add', previewUrl], { cwd: skillsDir })
    run('pnpm', ['build'], { cwd: skillsDir })

    if (!hasDiff(skillsDir)) {
      console.info('Preview package produced no skills repo diff; skipping PR.')
      return
    }

    run('git', [
      'config',
      'user.name',
      process.env.SKILLS_PREVIEW_GIT_NAME || 'f0rdream',
    ], {
      cwd: skillsDir,
    })
    run('git', [
      'config',
      'user.email',
      process.env.SKILLS_PREVIEW_GIT_EMAIL
      || 'f0rdream@users.noreply.github.com',
    ], { cwd: skillsDir })
    run('git', ['add', '-A'], { cwd: skillsDir })
    run('git', [
      'commit',
      '-m',
      `test: validate skill-lynx-ui preview from lynx-ui#${sourcePr}`,
    ], { cwd: skillsDir })
    run('git', ['push', '-f', 'origin', branchName], { cwd: skillsDir })

    const bodyPath = path.join(tempRoot, 'pr-body.md')
    writeFileSync(
      bodyPath,
      [
        `Validates \`${packageName}\` from lynx-family/lynx-ui#${sourcePr}.`,
        '',
        `Preview package: ${previewUrl}`,
        '',
        `Source commit: ${sourceSha}`,
        '',
        'This PR is for validation only and should not be merged as-is.',
        `The ${targetRepo} PR checks own the skill eval execution.`,
        '',
        `Expected eval path: \`evals/${evalSlug}\``,
      ].join('\n'),
    )

    upsertPullRequest({
      baseBranch,
      bodyPath,
      branchName,
      targetRepo,
      title,
    })
  } finally {
    rmSync(tempRoot, { force: true, recursive: true })
  }
}

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--metadata') {
      args.metadata = argv[++index]
    } else if (arg === '--source-pr') {
      args.sourcePr = argv[++index]
    } else if (arg === '--source-sha') {
      args.sourceSha = argv[++index]
    } else if (arg === '--package') {
      args.packageName = argv[++index]
    } else if (arg === '--target-repo') {
      args.targetRepo = argv[++index]
    } else if (arg === '--base') {
      args.baseBranch = argv[++index]
    } else if (arg === '--eval-slug') {
      args.evalSlug = argv[++index]
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }
  return args
}

function requiredArg(value, name) {
  if (!value) {
    throw new Error(`Missing ${name}.`)
  }
  return value
}

function hasPackageChangeset(packageName) {
  const changesetDir = path.resolve('.changeset')
  if (!existsSync(changesetDir)) {
    return false
  }
  const packageEntry = `"${packageName}":`
  return readdirSync(changesetDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .some(entry =>
      readFileSync(path.join(changesetDir, entry.name), 'utf8').includes(
        packageEntry,
      )
    )
}

function findPreviewUrl(metadataPath, packageName) {
  if (!existsSync(metadataPath)) {
    throw new Error(`pkg.pr.new metadata not found: ${metadataPath}`)
  }
  const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'))
  const previewPackage = metadata.packages?.find(
    packageInfo => packageInfo.name === packageName,
  )
  if (!previewPackage?.url) {
    throw new Error(`No pkg.pr.new preview URL found for ${packageName}.`)
  }
  return previewPackage.url
}

function hasDiff(cwd) {
  const result = spawnSync('git', ['status', '--porcelain'], {
    cwd,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error('Unable to inspect skills repo diff.')
  }
  return result.stdout.trim() !== ''
}

function upsertPullRequest(
  { baseBranch, bodyPath, branchName, targetRepo, title },
) {
  const existingPr = spawnSync('gh', [
    'pr',
    'view',
    branchName,
    '--repo',
    targetRepo,
    '--json',
    'url',
    '--jq',
    '.url',
  ], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  if (existingPr.status === 0 && existingPr.stdout.trim()) {
    const url = existingPr.stdout.trim()
    run('gh', [
      'pr',
      'edit',
      branchName,
      '--repo',
      targetRepo,
      '--title',
      title,
      '--body-file',
      bodyPath,
    ])
    console.info(`Updated skills validation PR: ${url}`)
    return
  }

  run('gh', [
    'pr',
    'create',
    '--repo',
    targetRepo,
    '--base',
    baseBranch,
    '--head',
    branchName,
    '--draft',
    '--title',
    title,
    '--body-file',
    bodyPath,
  ])
}

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: options.cwd,
    env: process.env,
    stdio: 'inherit',
  })
}

main()
