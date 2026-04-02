import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const TEXT_EXTS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.jsx',
  '.d.ts',
  '.d.mts',
  '.d.cts',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.map',
  '.json',
  '.md',
  '.mdx',
  '.txt',
])

function shouldRewrite(filePath) {
  const base = path.basename(filePath)

  if (
    base.endsWith('.d.ts')
    || base.endsWith('.d.mts')
    || base.endsWith('.d.cts')
    || base.endsWith('.d.ts.map')
    || base.endsWith('.d.mts.map')
    || base.endsWith('.d.cts.map')
  ) {
    return true
  }

  return TEXT_EXTS.has(path.extname(filePath))
}

function isJsSourceMap(filename) {
  if (!filename.endsWith('.map')) return false

  const isDtsMap = filename.endsWith('.d.ts.map')
    || filename.endsWith('.d.mts.map')
    || filename.endsWith('.d.cts.map')

  if (isDtsMap) return false

  return (
    filename.endsWith('.js.map')
    || filename.endsWith('.mjs.map')
    || filename.endsWith('.cjs.map')
    || filename.endsWith('.jsx.map')
  )
}

function copyDir(src, dst, { dropJsSourceMaps }) {
  fs.mkdirSync(dst, { recursive: true })

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dst, entry.name)

    if (entry.isDirectory()) {
      copyDir(s, d, { dropJsSourceMaps })
      continue
    }

    if (dropJsSourceMaps && isJsSourceMap(entry.name)) {
      continue
    }

    fs.copyFileSync(s, d)
  }
}

function normalizeRewriteMap(rewriteMap) {
  if (!rewriteMap) return []
  if (rewriteMap instanceof Map) return [...rewriteMap.entries()]
  if (Array.isArray(rewriteMap)) return rewriteMap
  throw new TypeError(
    'rewriteMap must be a Map or an array of [from, to] entries',
  )
}

function rewriteText(text, rewriteMap) {
  let next = text
  for (const [from, to] of normalizeRewriteMap(rewriteMap)) {
    next = next.split(from).join(to)
  }
  return next
}

function rewriteFile(filePath, rewriteMap) {
  if (!shouldRewrite(filePath)) return

  let text
  try {
    text = fs.readFileSync(filePath, 'utf8')
  } catch {
    return
  }

  const next = rewriteText(text, rewriteMap)
  if (next !== text) fs.writeFileSync(filePath, next)
}

function walk(dir, rewriteMap) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, rewriteMap)
    else rewriteFile(p, rewriteMap)
  }
}

function createResolver(fromDir) {
  if (!fromDir) {
    return {
      fromDir: path.dirname(fileURLToPath(import.meta.url)),
      require: createRequire(import.meta.url),
    }
  }
  const pkgJsonPath = path.join(fromDir, 'package.json')
  const parentPath = fs.existsSync(pkgJsonPath)
    ? pkgJsonPath
    : fileURLToPath(import.meta.url)
  return {
    fromDir,
    require: createRequire(pathToFileURL(parentPath)),
  }
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

function resolvePackageRoot(resolver, packageName) {
  const pkgDir = findInstalledPackageDir(resolver.fromDir, packageName)
  if (pkgDir) return pkgDir

  let entryPath
  try {
    entryPath = resolver.require.resolve(packageName)
  } catch (error) {
    throw new Error(
      `Could not resolve package entry for ${packageName} from ${resolver.fromDir}`,
      { cause: error },
    )
  }

  let dir = path.dirname(entryPath)
  for (let i = 0; i < 40; i += 1) {
    const pkgJsonPath = path.join(dir, 'package.json')
    if (fs.existsSync(pkgJsonPath)) return dir

    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  return path.dirname(entryPath)
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function copyAndRewriteFile(src, dst, rewriteMap) {
  ensureParentDir(dst)

  let text
  try {
    text = fs.readFileSync(src, 'utf8')
  } catch {
    fs.copyFileSync(src, dst)
    return
  }

  const next = rewriteText(text, rewriteMap)
  fs.writeFileSync(dst, next)
}

export const defaultDistRewriteMap = new Map([
  ['@dugyu/', '@lynx-js/'],
  ['@dugyu', '@lynx-js'],
])

export const defaultReadmeRewriteMap = new Map([
  ...defaultDistRewriteMap,
  ['Dugyu/lunarium', 'lynx-family/lynx-ui'],
  ['dugyu/lunarium', 'lynx-family/lynx-ui'],
  ['packages/core', 'luna/packages/luna-core'],
  ['packages/tokens', 'luna/packages/luna-tokens'],
  ['packages/styles', 'luna/packages/luna-styles'],
  ['packages/tailwind', 'luna/packages/luna-tailwind'],
  ['packages/reactlynx', 'luna/packages/luna-reactlynx'],
  ['/packages/core', '/luna/packages/luna-core'],
  ['/packages/tokens', '/luna/packages/luna-tokens'],
  ['/packages/styles', '/luna/packages/luna-styles'],
  ['/packages/tailwind', '/luna/packages/luna-tailwind'],
  ['/packages/reactlynx', '/luna/packages/luna-reactlynx'],
])

export function syncPackage({
  upstreamPackage,
  outRoot,
  distDirName = 'dist',
  readmeFileName = 'README.md',
  distRewriteMap = defaultDistRewriteMap,
  readmeRewriteMap = defaultReadmeRewriteMap,
  dropJsSourceMaps = true,
  syncDist = true,
  syncReadme = true,
  requireReadme = false,
  cleanDist = true,
}) {
  const shouldRun = syncDist || syncReadme
  if (shouldRun === false) {
    throw new Error('At least one of syncDist/syncReadme must be enabled.')
  }

  const resolver = createResolver(outRoot)
  const upstreamRoot = resolvePackageRoot(resolver, upstreamPackage)
  const upstreamDist = path.join(upstreamRoot, distDirName)
  const upstreamReadme = path.join(upstreamRoot, readmeFileName)

  const outDist = path.join(outRoot, distDirName)
  const outReadme = path.join(outRoot, readmeFileName)

  if (syncDist) {
    const hasUpstreamDist = fs.existsSync(upstreamDist)
    if (hasUpstreamDist) {
      if (cleanDist) fs.rmSync(outDist, { recursive: true, force: true })
      copyDir(upstreamDist, outDist, { dropJsSourceMaps })
      walk(outDist, distRewriteMap)
    } else {
      throw new Error(
        `Upstream dist not found: ${upstreamDist}\n`
          + `Install and build the upstream package first: ${upstreamPackage}`,
      )
    }
  }

  const hasUpstreamReadme = fs.existsSync(upstreamReadme)
  if (syncReadme) {
    if (hasUpstreamReadme) {
      copyAndRewriteFile(upstreamReadme, outReadme, readmeRewriteMap)
    } else if (requireReadme) {
      throw new Error(
        `Upstream README not found: ${upstreamReadme}\n`
          + `Upstream package: ${upstreamPackage}`,
      )
    }
  }

  return {
    upstreamRoot,
    upstreamDist: syncDist ? upstreamDist : null,
    upstreamReadme: hasUpstreamReadme ? upstreamReadme : null,
    outDist: syncDist ? outDist : null,
    outReadme: syncReadme && hasUpstreamReadme ? outReadme : null,
  }
}

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

const mainPath = process.argv[1]
const isMain = typeof mainPath === 'string'
  && import.meta.url === pathToFileURL(mainPath).href
if (isMain) {
  const args = parseArgs(process.argv.slice(2))
  const upstreamPackage = args.get('--upstream')
  const outRoot = args.get('--out')
  const readmeOnly = Boolean(args.get('--readme-only'))
  const syncReadme = readmeOnly ? true : !args.get('--no-readme')
  const syncDist = readmeOnly ? false : !args.get('--no-dist')

  if (!upstreamPackage || !outRoot) {
    throw new Error(
      [
        'Usage:',
        '  node luna/tools/shim/sync-package.mjs --upstream <pkg> --out <outRoot>',
        '  node luna/tools/shim/sync-package.mjs --upstream <pkg> --out <outRoot> --readme-only',
        '',
        'Example:',
        '  node luna/tools/shim/sync-package.mjs --upstream @dugyu/luna-core --out luna/packages/luna-core',
      ].join('\n'),
    )
  }

  syncPackage({
    upstreamPackage,
    outRoot: path.resolve(process.cwd(), outRoot),
    syncDist,
    syncReadme,
    requireReadme: readmeOnly,
  })
}
