import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

// Configuration: The remote branch to compare against (usually to prevent regression when pushing to main)
const REMOTE_BRANCH = 'origin/main'

function getSubmodules() {
  try {
    const gitmodules = readFileSync('.gitmodules', 'utf-8')
    const matches = gitmodules.matchAll(/path = (.+)/g)
    return Array.from(matches, m => m[1].trim())
  } catch {
    return []
  }
}

function checkSubmodule(path) {
  console.log(`Checking submodule: ${path}...`)

  // 1. Get the submodule commit recorded on the remote branch
  let oldCommit
  try {
    const output = execSync(`git ls-tree ${REMOTE_BRANCH} ${path}`, {
      encoding: 'utf-8',
    }).trim()
    if (!output) {
      console.log(`  New submodule (not in ${REMOTE_BRANCH}). Skipping.`)
      return true
    }
    oldCommit = output.split(/\s+/)[2]
  } catch {
    console.warn(`  Failed to get info from ${REMOTE_BRANCH}. Skipping.`)
    return true
  }

  let newCommit
  try {
    const output = execSync(`git ls-tree HEAD ${path}`, { encoding: 'utf-8' })
      .trim()
    newCommit = output.split(/\s+/)[2]
  } catch {
    console.error(`  Failed to get info from HEAD.`)
    return false
  }

  if (oldCommit === newCommit) {
    console.log(`  Unchanged.`)
    return true
  }

  if (!existsSync(path)) {
    console.error(
      `  Submodule directory not found. Please run 'pnpm update:submodules' first.`,
    )
    return false
  }

  try {
    try {
      execSync(`git merge-base --is-ancestor ${newCommit} ${oldCommit}`, {
        cwd: path,
        stdio: 'ignore',
      })

      console.error(`\n❌ ERROR: Submodule "${path}" regression detected!`)
      console.error(`  Remote (${REMOTE_BRANCH}): ${oldCommit}`)
      console.error(`  Current (HEAD):       ${newCommit}`)
      console.error(
        `  You are attempting to push an OLDER version of the submodule.`,
      )
      console.error(
        `  Please update the submodule: 'git submodule update --remote ${path}'\n`,
      )
      return false
    } catch {
      try {
        execSync(`git merge-base --is-ancestor ${oldCommit} ${newCommit}`, {
          cwd: path,
          stdio: 'ignore',
        })
        console.log(
          `  ✅ Updated (Fast-forward): ${oldCommit.slice(0, 7)} -> ${
            newCommit.slice(0, 7)
          }`,
        )
        return true
      } catch {
        console.warn(
          `  ⚠️  Diverged: New and Old commits have diverged. Proceed with caution.`,
        )
        return true
      }
    }
  } catch (e) {
    console.error(
      `  Failed to compare commits in submodule. Error: ${e.message}`,
    )
    return false
  }
}

function main() {
  try {
    execSync(`git fetch origin main`, { stdio: 'ignore' })
  } catch {}

  const submodules = getSubmodules()
  if (submodules.length === 0) {
    console.log('No submodules found.')
    return
  }

  let hasError = false
  for (const path of submodules) {
    if (!checkSubmodule(path)) {
      hasError = true
    }
  }

  if (hasError) {
    // eslint-disable-next-line n/no-process-exit
    process.exit(1)
  } else {
    console.log('\n✅ All submodules check passed.')
  }
}

main()
