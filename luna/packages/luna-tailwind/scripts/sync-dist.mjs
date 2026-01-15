// luna/packages/luna-tailwind/scripts/sync-dist.mjs
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { syncDist } from '../../../tools/shim/sync-dist.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// shimRoot = repo-root/luna/packages/luna-tailwind
const shimRoot = path.resolve(__dirname, '..')

// upstreamDist = repo-root/lunarium/packages/tailwind/dist
const upstreamDist = path.resolve(
  shimRoot,
  '../../../lunarium/packages/tailwind/dist',
)

// outDist = repo-root/luna/packages/luna-tailwind/dist
const outDist = path.resolve(shimRoot, 'dist')

syncDist({ upstreamDist, outDist })
