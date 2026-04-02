import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

function parseArgs(argv) {
  const args = new Map()
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i]
    if (!key?.startsWith('--')) continue
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) {
      args.set(key, true)
      continue
    }
    args.set(key, value)
    i += 1
  }
  return args
}

function printHelp() {
  process.stdout.write(
    [
      'Usage:',
      '  node luna/tools/shim/pin-upstream-versions.mjs [options]',
      '',
      'Options:',
      '  --dry-run             Print which packages would be updated without writing files',
      '  --mode <mode>         Version pin mode for @dugyu/luna-* in devDependencies',
      '                         One of: exact | caret | tilde (default: exact)',
      '  --set <version>       Force all matched @dugyu/luna-* to this version (ignores installed version)',
      '  --repo-root <path>    Repo root path (default: auto-detect by walking up from cwd)',
      '  --help                Show this help message',
      '',
      'Examples:',
      '  node luna/tools/shim/pin-upstream-versions.mjs --dry-run',
      '  node luna/tools/shim/pin-upstream-versions.mjs --mode exact',
      '  node luna/tools/shim/pin-upstream-versions.mjs --set 0.3.0',
      '  (from luna/) node tools/shim/pin-upstream-versions.mjs --dry-run',
      '',
      'What it does:',
      '  - Pins devDependencies[@dugyu/luna-*] versions in luna/packages/*',
      '  - Syncs key metadata fields from the installed upstream package.json:',
      '    exports, sideEffects, peerDependencies, main/module/types, files (adds CHANGELOG.md)',
      '  - Rewrites repository/homepage to point to lynx-family/lynx-ui and luna/packages/<name>',
      '',
    ].join('\n'),
  )
}

function createResolver(fromDir) {
  const pkgJsonPath = path.join(fromDir, 'package.json')
  const parentPath = fs.existsSync(pkgJsonPath)
    ? pkgJsonPath
    : fileURLToPath(import.meta.url)
  return {
    fromDir,
    require: createRequire(pathToFileURL(parentPath)),
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n')
}

function listLunaPackageJsonPaths(repoRoot) {
  const lunaPackagesDir = path.join(repoRoot, 'luna', 'packages')
  if (fs.existsSync(lunaPackagesDir) === false) {
    throw new Error(
      `Could not find luna packages directory at: ${lunaPackagesDir}\n`
        + `repoRoot: ${repoRoot}`,
    )
  }
  const entries = fs.readdirSync(lunaPackagesDir, { withFileTypes: true })

  const paths = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const pkgJsonPath = path.join(lunaPackagesDir, entry.name, 'package.json')
    if (fs.existsSync(pkgJsonPath)) paths.push(pkgJsonPath)
  }
  return paths
}

function findRepoRoot(startDir) {
  let dir = startDir

  for (let i = 0; i < 40; i += 1) {
    const hasWorkspace = fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))
    const hasLunaPackages = fs.existsSync(path.join(dir, 'luna', 'packages'))
    if (hasWorkspace && hasLunaPackages) return dir

    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  throw new Error(`Could not find repo root from: ${startDir}`)
}

function isUpstreamPackageName(name) {
  return typeof name === 'string' && name.startsWith('@dugyu/luna-')
}

function normalizeMode(mode) {
  if (!mode) return 'exact'
  if (mode === 'exact' || mode === 'caret' || mode === 'tilde') return mode
  throw new Error(`Unsupported --mode: ${mode}`)
}

function formatSpec(version, mode) {
  if (mode === 'exact') return version
  if (mode === 'tilde') return `~${version}`
  return `^${version}`
}

function findPackageJsonPath(fromPath) {
  let dir = fs.statSync(fromPath).isDirectory()
    ? fromPath
    : path.dirname(fromPath)

  for (let i = 0; i < 40; i += 1) {
    const candidate = path.join(dir, 'package.json')
    if (fs.existsSync(candidate)) return candidate

    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  throw new Error(
    `Could not locate package.json from resolved path: ${fromPath}`,
  )
}

function findInstalledPackageDir(fromDir, packageName) {
  const parts = packageName.startsWith('@')
    ? packageName.split('/')
    : [packageName]

  let dir = fromDir
  for (let i = 0; i < 40; i += 1) {
    const candidate = path.join(dir, 'node_modules', ...parts)
    if (fs.existsSync(candidate)) return candidate

    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  return null
}

function resolveInstalledVersion(resolver, packageName) {
  const pkgJson = resolveInstalledPackageJson(resolver, packageName)
  if (!pkgJson.version) {
    throw new Error(
      `Missing version in ${packageName}/package.json`,
    )
  }
  return pkgJson.version
}

function resolveInstalledPackageJson(resolver, packageName) {
  const pkgDir = findInstalledPackageDir(resolver.fromDir, packageName)
  const pkgJsonPath = pkgDir
    ? path.join(pkgDir, 'package.json')
    : findPackageJsonPath(resolver.require.resolve(packageName))
  const pkgJson = readJson(pkgJsonPath)
  if (!pkgJson || typeof pkgJson !== 'object') {
    throw new Error(`Invalid package.json for ${packageName} at ${pkgJsonPath}`)
  }
  return pkgJson
}

function toPosixPath(p) {
  return p.split(path.sep).join('/')
}

function inferSelfUpstreamName(localPackageName) {
  const prefix = '@lynx-js/luna-'
  if (typeof localPackageName !== 'string') return null
  if (localPackageName.startsWith(prefix) === false) return null
  return `@dugyu/luna-${localPackageName.slice(prefix.length)}`
}

function rewriteRepoString(value, { localDirectory }) {
  if (typeof value !== 'string') return value

  const rewriteMap = [
    [
      'github.com/Dugyu/lunarium',
      'github.com/lynx-family/lynx-ui',
    ],
    [
      'github.com/dugyu/lunarium',
      'github.com/lynx-family/lynx-ui',
    ],
    ['Dugyu/lunarium', 'lynx-family/lynx-ui'],
    ['dugyu/lunarium', 'lynx-family/lynx-ui'],
  ]

  let next = value
  for (const [from, to] of rewriteMap) {
    next = next.split(from).join(to)
  }

  if (localDirectory) {
    next = next.split('packages/core').join(localDirectory)
    next = next.split('packages/tokens').join(localDirectory)
    next = next.split('packages/styles').join(localDirectory)
    next = next.split('packages/tailwind').join(localDirectory)
    next = next.split('packages/reactlynx').join(localDirectory)

    next = next.split('/packages/core').join(`/${localDirectory}`)
    next = next.split('/packages/tokens').join(`/${localDirectory}`)
    next = next.split('/packages/styles').join(`/${localDirectory}`)
    next = next.split('/packages/tailwind').join(`/${localDirectory}`)
    next = next.split('/packages/reactlynx').join(`/${localDirectory}`)
  }

  return next
}

function syncMetadataFromUpstream({
  repoRoot,
  localPkgDir,
  localPkgJson,
  upstreamPkgJson,
}) {
  const localDirectory = toPosixPath(path.relative(repoRoot, localPkgDir))

  const fieldsToCopy = [
    'description',
    'keywords',
    'homepage',
    'repository',
    'sideEffects',
    'type',
    'exports',
    'main',
    'module',
    'types',
    'peerDependencies',
  ]

  let changed = false

  for (const field of fieldsToCopy) {
    if (upstreamPkgJson[field] === undefined) continue

    if (field === 'homepage') {
      const nextHomepage = rewriteRepoString(upstreamPkgJson.homepage, {
        localDirectory,
      })
      if (localPkgJson.homepage !== nextHomepage) {
        localPkgJson.homepage = nextHomepage
        changed = true
      }
      continue
    }

    if (field === 'repository') {
      const upstreamRepo = upstreamPkgJson.repository
      if (typeof upstreamRepo === 'string') {
        const nextRepo = rewriteRepoString(upstreamRepo, { localDirectory })
        if (localPkgJson.repository !== nextRepo) {
          localPkgJson.repository = nextRepo
          changed = true
        }
        continue
      }

      if (upstreamRepo && typeof upstreamRepo === 'object') {
        const nextRepo = {
          ...upstreamRepo,
          url: rewriteRepoString(upstreamRepo.url, { localDirectory }),
          directory: localDirectory,
        }
        const prev = JSON.stringify(localPkgJson.repository ?? null)
        const next = JSON.stringify(nextRepo)
        if (prev !== next) {
          localPkgJson.repository = nextRepo
          changed = true
        }
      }
      continue
    }

    const prev = JSON.stringify(localPkgJson[field] ?? null)
    const next = JSON.stringify(upstreamPkgJson[field])
    if (prev !== next) {
      localPkgJson[field] = upstreamPkgJson[field]
      changed = true
    }
  }

  const upstreamFiles = Array.isArray(upstreamPkgJson.files)
    ? upstreamPkgJson.files.filter((v) => typeof v === 'string')
    : []
  const baselineFiles = ['dist', 'CHANGELOG.md', 'LICENSE', 'README.md']
  const files = []
  for (const f of baselineFiles) {
    if (files.includes(f) === false) files.push(f)
  }
  for (const f of upstreamFiles) {
    if (files.includes(f) === false) files.push(f)
  }

  const prevFiles = JSON.stringify(localPkgJson.files ?? null)
  const nextFiles = JSON.stringify(files)
  if (prevFiles !== nextFiles) {
    localPkgJson.files = files
    changed = true
  }

  return changed
}

export function pinUpstreamVersions({
  repoRoot,
  mode = 'exact',
  setVersion,
  dryRun = false,
}) {
  const packageJsonPaths = listLunaPackageJsonPaths(repoRoot)
  const updates = []

  for (const pkgJsonPath of packageJsonPaths) {
    const pkgDir = path.dirname(pkgJsonPath)
    const pkgJson = readJson(pkgJsonPath)
    const devDependencies = pkgJson.devDependencies
    if (!devDependencies) continue

    const upstreamNames = Object.keys(devDependencies).filter((name) =>
      isUpstreamPackageName(name)
    )
    if (upstreamNames.length === 0) continue

    const resolver = createResolver(pkgDir)
    let changed = false
    const selfUpstreamName = inferSelfUpstreamName(pkgJson.name)
    const upstreamForMetadata = upstreamNames.includes(selfUpstreamName)
      ? selfUpstreamName
      : upstreamNames[0]

    const upstreamPkgJson = resolveInstalledPackageJson(
      resolver,
      upstreamForMetadata,
    )
    const changedByMetadata = syncMetadataFromUpstream({
      repoRoot,
      localPkgDir: pkgDir,
      localPkgJson: pkgJson,
      upstreamPkgJson,
    })
    if (changedByMetadata) changed = true

    for (const upstreamName of upstreamNames) {
      const resolvedVersion = setVersion
        || resolveInstalledVersion(resolver, upstreamName)
      const nextSpec = formatSpec(resolvedVersion, mode)

      if (devDependencies[upstreamName] !== nextSpec) {
        devDependencies[upstreamName] = nextSpec
        changed = true
      }
    }

    if (changed) {
      updates.push({ pkgJsonPath, pkgName: pkgJson.name })
      if (!dryRun) writeJson(pkgJsonPath, pkgJson)
    }
  }

  return updates
}

const mainPath = process.argv[1]
const isMain = typeof mainPath === 'string'
  && import.meta.url === pathToFileURL(mainPath).href

if (isMain) {
  const args = parseArgs(process.argv.slice(2))
  if (args.get('--help')) {
    printHelp()
    // eslint-disable-next-line n/no-process-exit
    process.exit(0)
  }
  const repoRoot = args.get('--repo-root')
    ? path.resolve(process.cwd(), args.get('--repo-root'))
    : findRepoRoot(process.cwd())
  const mode = normalizeMode(args.get('--mode'))
  const setVersion = args.get('--set')
  const dryRun = Boolean(args.get('--dry-run'))

  const updates = pinUpstreamVersions({
    repoRoot,
    mode,
    setVersion,
    dryRun,
  })

  const prefix = dryRun ? '[dry-run] ' : ''
  for (const u of updates) {
    process.stdout.write(`${prefix}updated ${u.pkgName} (${u.pkgJsonPath})\n`)
  }
}
