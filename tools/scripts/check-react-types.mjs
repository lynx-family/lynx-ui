// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'
import { parse } from 'yaml'

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)
const reactTypesVersions = { 18: '18.3.31', 19: '19.2.18' }
const args = process.argv.slice(2)
const version = args[args.indexOf('--react-types') + 1]
if (
  !args.includes('--react-types')
  || !Object.hasOwn(reactTypesVersions, version)
) {
  throw new Error(
    'Usage: check-react-types.mjs --react-types <18|19> [--full-declarations]',
  )
}
const fullDeclarations = args.includes('--full-declarations')
const workspace = parse(
  fs.readFileSync(path.join(repoRoot, 'pnpm-workspace.yaml'), 'utf8'),
)

function getPackages(directory, prefix) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (!entry.isDirectory()) return []
    const root = path.join(directory, entry.name)
    const manifest = path.join(root, 'package.json')
    if (!fs.existsSync(manifest)) return []
    const json = JSON.parse(fs.readFileSync(manifest, 'utf8'))
    return !json.private && json.name.startsWith(prefix) ? [{ root, json }] : []
  })
}

const packages = getPackages(
  path.join(repoRoot, 'packages'),
  '@lynx-js/lynx-ui',
)
const examples = getPackages(
  path.join(repoRoot, 'apps/examples'),
  '@lynx-example/lynx-ui-',
)
if (!packages.length || !examples.length) {
  throw new Error('No component packages or example sources found.')
}

const dependencies = {
  '@lynx-js/react': workspace.catalog['@lynx-js/react'],
  '@lynx-js/types': workspace.catalog['@lynx-js/types'],
}
for (const { json } of packages) {
  for (const [name, specifier] of Object.entries(json.dependencies ?? {})) {
    if (specifier.startsWith('workspace:')) continue
    dependencies[name] = specifier.startsWith('catalog:')
      ? (specifier === 'catalog:'
        ? workspace.catalog
        : workspace.catalogs[specifier.slice('catalog:'.length)])[name]
      : specifier
  }
}
dependencies['@types/react'] = reactTypesVersions[version]

const sandbox = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), 'lynx-ui-react-types-')),
)
const formatHost = {
  getCanonicalFileName: file => file,
  getCurrentDirectory: () => sandbox,
  getNewLine: () => '\n',
}

function check(rootNames, options, label) {
  const program = ts.createProgram(rootNames, options)
  // Even a transitive React 18 import would restore global JSX and mask TS2694.
  const reactRoot = path.join(sandbox, 'node_modules/@types/react')
  const reactFiles = program.getSourceFiles().filter(file =>
    /[/\\]@types[/\\]react[/\\]/.test(file.fileName)
  )
  if (
    !reactFiles.length
    || reactFiles.some(file =>
      !file.fileName.startsWith(`${reactRoot}${path.sep}`)
    )
  ) {
    throw new Error(`${label}: React type environment is not isolated.`)
  }
  const diagnostics = ts.getPreEmitDiagnostics(program)
  if (diagnostics.length) {
    throw new Error(
      `${label}:\n${ts.formatDiagnostics(diagnostics, formatHost)}`,
    )
  }
  console.log(`React ${version}: ${label} passed (${rootNames.length} files).`)
}

try {
  fs.writeFileSync(
    path.join(sandbox, 'package.json'),
    JSON.stringify({ private: true, type: 'module', dependencies }),
  )
  execFileSync('npm', [
    'install',
    '--ignore-scripts',
    '--legacy-peer-deps',
    '--no-audit',
    '--no-fund',
    '--package-lock=false',
  ], { cwd: sandbox, stdio: 'inherit' })

  const entries = packages.map(({ root, json }) => {
    const source = path.resolve(root, json.types)
    if (!fs.existsSync(source)) {
      throw new Error(
        `${json.name}: missing declarations; build packages before running this check.`,
      )
    }
    const target = path.join(sandbox, 'node_modules', json.name)
    fs.mkdirSync(target, { recursive: true })
    fs.cpSync(path.join(root, 'dist'), path.join(target, 'dist'), {
      recursive: true,
    })
    fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify(json))
    return { name: json.name, entry: path.resolve(target, json.types) }
  })
  const assets = path.join(sandbox, 'assets.d.ts')
  fs.copyFileSync(path.join(repoRoot, 'tools/typings/asset.d.ts'), assets)
  const options = {
    strict: true,
    noEmit: true,
    skipLibCheck: !fullDeclarations,
    jsx: ts.JsxEmit.ReactJSX,
    jsxImportSource: '@lynx-js/react',
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ['lib.esnext.d.ts'],
    types: ['@lynx-js/types'],
    typeRoots: [
      path.join(sandbox, 'node_modules/@types'),
      path.join(sandbox, 'node_modules'),
    ],
  }

  const declarations = ts.createProgram(
    entries.map(({ entry }) => entry),
    options,
  )
  const checker = declarations.getTypeChecker()
  const lines = ['import type { ComponentProps } from \'@lynx-js/react\'']
  const componentNames = new Set()
  let count = 0
  for (const [index, { name, entry }] of entries.entries()) {
    const alias = `Package${index}`
    lines.push(`import * as ${alias} from '${name}'`)
    const symbol = checker.getSymbolAtLocation(
      declarations.getSourceFile(entry),
    )
    if (!symbol) throw new Error(`${name}: declaration entry is not a module.`)
    for (let exported of checker.getExportsOfModule(symbol)) {
      const component = exported.name
      if (!/^[A-Z]/.test(component) || component.endsWith('Context')) continue
      if (exported.flags & ts.SymbolFlags.Alias) {
        exported = checker.getAliasedSymbol(exported)
      }
      if (!exported.valueDeclaration) continue
      const type = checker.getTypeOfSymbolAtLocation(
        exported,
        exported.valueDeclaration,
      )
      if (!type.getCallSignatures().length) continue
      lines.push(
        `declare const props${count}: ComponentProps<typeof ${alias}.${component}>`,
        `<${alias}.${component} {...props${count}} />`,
      )
      count++
      componentNames.add(component)
    }
  }
  if (!count) throw new Error('No exported components found.')
  const exportsFixture = path.join(sandbox, 'exports.tsx')
  fs.writeFileSync(exportsFixture, lines.join('\n'))
  const consumerFixture = path.join(sandbox, 'components.tsx')
  fs.copyFileSync(
    path.join(repoRoot, 'tools/type-tests/components.tsx'),
    consumerFixture,
  )
  check(
    [assets, exportsFixture, consumerFixture],
    options,
    'component consumers',
  )
  console.log(
    `${componentNames.size} unique components, ${count} main/direct exports, ${packages.length} packages.`,
  )

  const exampleFiles = examples.flatMap(({ root, json }) => {
    const target = path.join(sandbox, 'examples', json.name.split('/')[1])
    fs.cpSync(root, target, {
      recursive: true,
      filter: source =>
        !['node_modules', 'dist'].includes(path.basename(source)),
    })
    return ts.sys.readDirectory(target, ['.ts', '.tsx'], [
      '**/tailwind.config.ts',
      '**/vitest.config.ts',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/__tests__/**',
    ])
  })
  if (!exampleFiles.length) throw new Error('No example TS/TSX sources found.')
  check([assets, ...exampleFiles], options, 'example sources')
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true })
}
