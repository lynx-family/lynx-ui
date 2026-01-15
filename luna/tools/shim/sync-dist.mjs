// luna/tools/shim/sync-dist.mjs
import fs from 'node:fs'
import path from 'node:path'

// Text-like files that may contain import specifiers or embedded source content.
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
])

function shouldRewrite(filePath) {
  const base = path.basename(filePath)

  // Handle compound extensions explicitly.
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
  // Keep declaration maps, drop JS sourcemaps by default.
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

function rewriteFile(filePath, rewriteMap) {
  if (!shouldRewrite(filePath)) return

  let text
  try {
    text = fs.readFileSync(filePath, 'utf8')
  } catch {
    // Skip non-UTF8/binary files.
    return
  }

  let next = text
  for (const [from, to] of rewriteMap) {
    next = next.split(from).join(to)
  }

  if (next !== text) fs.writeFileSync(filePath, next)
}

function walk(dir, rewriteMap) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, rewriteMap)
    else rewriteFile(p, rewriteMap)
  }
}

// Rewrite map: extend later when you add more shim packages.
export const defaultRewriteMap = new Map([
  ['@dugyu/luna-core', '@lynx-js/luna-core'],
  ['@dugyu/luna-tokens', '@lynx-js/luna-tokens'],
  ['@dugyu/luna-styles', '@lynx-js/luna-styles'],
  ['@dugyu/luna-tailwind', '@lynx-js/luna-tailwind'],
  ['@dugyu/luna-reactlynx', '@lynx-js/luna-reactlynx'],
])

export function syncDist({
  upstreamDist,
  outDist,
  rewriteMap = defaultRewriteMap,
  dropJsSourceMaps = true,
}) {
  if (!fs.existsSync(upstreamDist)) {
    throw new Error(
      `Upstream dist not found: ${upstreamDist}\n`
        + `Build the upstream package first.`,
    )
  }

  fs.rmSync(outDist, { recursive: true, force: true })
  copyDir(upstreamDist, outDist, { dropJsSourceMaps })
  walk(outDist, rewriteMap)
}
