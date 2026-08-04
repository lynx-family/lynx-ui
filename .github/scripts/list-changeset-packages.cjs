#!/usr/bin/env node

const { execSync } = require('node:child_process')
const { readFileSync } = require('node:fs')

const statusFile = process.argv[2] || '.changeset-status.json'
const data = JSON.parse(readFileSync(statusFile, 'utf8'))
const releases = Array.isArray(data.releases) ? data.releases : []

const affected = new Set(
  releases
    .filter((release) => release?.type && release.type !== 'none')
    .map((release) => release.name)
    .filter(Boolean),
)

if (affected.size > 0) {
  const workspace = JSON.parse(
    execSync('pnpm --recursive list --json --depth=-1', {
      encoding: 'utf8',
    }),
  )

  if (!Array.isArray(workspace)) {
    throw new TypeError('Expected pnpm recursive list to return an array')
  }

  for (const pkg of workspace) {
    if (!pkg.name || pkg.private) {
      continue
    }

    if (!affected.has(pkg.name)) {
      continue
    }

    process.stdout.write(`${pkg.path}\n`)
  }
}
