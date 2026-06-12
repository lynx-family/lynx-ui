// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseDocument } from 'yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '..', '..')
const packageRoot = path.join(workspaceRoot, 'packages', 'skill-lynx-ui')
const packageJsonPath = path.join(packageRoot, 'package.json')
const skillMdPath = path.join(packageRoot, 'SKILL.md')
const evalRoot = path.join(packageRoot, 'evals')
const skillPackagePrefix = '@lynx-js/skill-'

async function main() {
  const packageJson = await readJson(packageJsonPath)
  const skill = parseSkillFrontmatter(await readFile(skillMdPath, 'utf8'))
  const packageName = packageJson.name

  if (
    typeof packageName !== 'string'
    || !packageName.startsWith(skillPackagePrefix)
  ) {
    throw new Error(
      `${packageJsonPath} name must start with ${skillPackagePrefix}`,
    )
  }

  const exportDirName = packageName.slice(skillPackagePrefix.length)
  if (exportDirName !== skill.name) {
    throw new Error(
      [
        'Exported skill directory would not match SKILL.md name:',
        `- package name: ${packageName}`,
        `- exported directory: ${exportDirName}`,
        `- SKILL.md name: ${skill.name}`,
      ].join('\n'),
    )
  }

  const task = await validateTaskEvals(
    skill.name,
    path.join(evalRoot, 'evals.json'),
  )
  const trigger = await validateTriggerEvals(
    path.join(evalRoot, 'trigger_eval.json'),
  )

  console.info(
    [
      'Skill eval definition check passed.',
      `skill=${skill.name}`,
      `task_evals=${task.taskEvals}`,
      `expectations=${task.expectations}`,
      `trigger_evals=${trigger.total}`,
    ].join(' '),
  )
}

function parseSkillFrontmatter(content) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(content)
  if (!match) {
    throw new Error(`${skillMdPath} missing frontmatter`)
  }

  const document = parseDocument(match[1])
  if (document.errors.length > 0) {
    throw new Error(
      `${skillMdPath} has invalid YAML frontmatter: ${
        document.errors[0].message
      }`,
    )
  }

  const frontmatter = document.toJS()
  assertObject(frontmatter, `${skillMdPath} frontmatter`)
  if (typeof frontmatter.name !== 'string' || frontmatter.name.trim() === '') {
    throw new Error(`${skillMdPath} frontmatter missing name`)
  }
  if (
    typeof frontmatter.description !== 'string'
    || frontmatter.description.trim() === ''
  ) {
    throw new Error(`${skillMdPath} frontmatter missing description`)
  }
  return { name: frontmatter.name }
}

async function validateTaskEvals(skillName, filePath) {
  const payload = await readJson(filePath)
  assertObject(payload, `${filePath} root`)
  if (payload.skill_name !== skillName) {
    throw new Error(
      `${filePath} skill_name must match SKILL.md name \`${skillName}\``,
    )
  }
  if (!Array.isArray(payload.evals) || payload.evals.length === 0) {
    throw new Error(`${filePath} evals must be a non-empty array`)
  }

  const ids = new Set()
  const names = new Set()
  let expectations = 0
  for (const [index, item] of payload.evals.entries()) {
    assertObject(item, `${filePath} eval #${index + 1}`)
    const id = item.id
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(`${filePath} eval #${index + 1} has invalid id`)
    }
    if (ids.has(id)) {
      throw new Error(`${filePath} duplicate eval id ${id}`)
    }
    ids.add(id)

    if (typeof item.name !== 'string' || item.name.trim() === '') {
      throw new Error(`${filePath} eval id ${id} missing name`)
    }
    if (names.has(item.name)) {
      throw new Error(`${filePath} duplicate eval name ${item.name}`)
    }
    names.add(item.name)

    if (typeof item.prompt !== 'string' || item.prompt.trim().length < 20) {
      throw new Error(`${filePath} eval id ${id} prompt too short`)
    }
    if (
      typeof item.expected_output !== 'string'
      || item.expected_output.trim().length < 10
    ) {
      throw new Error(`${filePath} eval id ${id} missing expected_output`)
    }
    if (
      !Array.isArray(item.files)
      || item.files.some(file => typeof file !== 'string')
    ) {
      throw new Error(
        `${filePath} eval id ${id} files must be an array of strings`,
      )
    }
    if (!Array.isArray(item.expectations) || item.expectations.length < 3) {
      throw new Error(
        `${filePath} eval id ${id} must have at least 3 expectations`,
      )
    }
    if (
      item.expectations.some(
        expectation =>
          typeof expectation !== 'string' || expectation.trim() === '',
      )
    ) {
      throw new Error(
        `${filePath} eval id ${id} has invalid expectation entries`,
      )
    }
    expectations += item.expectations.length
  }

  return {
    expectations,
    taskEvals: payload.evals.length,
  }
}

async function validateTriggerEvals(filePath) {
  const payload = await readJson(filePath)
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error(`${filePath} must be a non-empty array`)
  }

  let positive = 0
  let negative = 0
  for (const [index, item] of payload.entries()) {
    assertObject(item, `${filePath} item #${index + 1}`)
    if (typeof item.query !== 'string' || item.query.trim().length < 10) {
      throw new Error(`${filePath} item #${index + 1} query too short`)
    }
    if (typeof item.should_trigger !== 'boolean') {
      throw new Error(
        `${filePath} item #${index + 1} should_trigger must be boolean`,
      )
    }
    if (item.should_trigger) {
      positive += 1
    } else {
      negative += 1
    }
  }
  if (positive === 0 || negative === 0) {
    throw new Error(`${filePath} must contain both positive and negative cases`)
  }
  return {
    negative,
    positive,
    total: payload.length,
  }
}

async function readJson(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`missing JSON file: ${filePath}`)
  }
  try {
    return JSON.parse(await readFile(filePath, 'utf8'))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`invalid JSON in ${filePath}: ${message}`)
  }
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
}

await main()
