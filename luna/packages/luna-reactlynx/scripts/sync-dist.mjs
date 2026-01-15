import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { syncDist } from '../../../tools/shim/sync-dist.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// shimRoot = repo-root/luna/packages/luna-reactlynx
const shimRoot = path.resolve(__dirname, '..')

// upstreamDist = repo-root/lunarium/packages/reactlynx/dist
const upstreamDist = path.resolve(
  shimRoot,
  '../../../lunarium/packages/reactlynx/dist',
)

// outDist = repo-root/luna/packages/luna-reactlynx/dist
const outDist = path.resolve(shimRoot, 'dist')

syncDist({ upstreamDist, outDist })
