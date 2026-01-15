// luna/packages/luna-tokens/scripts/sync-dist.mjs
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { syncDist } from '../../../tools/shim/sync-dist.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// shimRoot = repo-root/luna/packages/luna-tokens
const shimRoot = path.resolve(__dirname, '..')

// upstreamDist = repo-root/lunarium/packages/tokens/dist
const upstreamDist = path.resolve(
  shimRoot,
  '../../../lunarium/packages/tokens/dist',
)

// outDist = repo-root/luna/packages/luna-tokens/dist
const outDist = path.resolve(shimRoot, 'dist')

syncDist({
  upstreamDist,
  outDist,
  dropJsSourceMaps: true,
})
