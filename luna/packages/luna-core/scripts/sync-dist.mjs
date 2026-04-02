import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { syncPackage } from '../../../tools/shim/sync-package.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const outRoot = path.resolve(__dirname, '..')

syncPackage({
  upstreamPackage: '@dugyu/luna-core',
  outRoot,
  dropJsSourceMaps: true,
  syncDist: true,
  syncReadme: false,
})
