// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { findStaleDocLinks } from './check-doc-site-links.mjs'

describe('findStaleDocLinks', () => {
  it('detects legacy public and internal documentation URLs', () => {
    const violations = findStaleDocLinks(`
https://lynxjs.org/lynx-ui/components/button.html
https://lynxjs.org/next/lynx-ui/components/button.html
https://lynxjs.org/2.0/lynx-ui/components/button.html
https://lynx-ui.bytedance.net/Components/Components/Button.html
`)

    assert.equal(violations.length, 4)
  })

  it('detects root-relative Markdown and MDX links', () => {
    const violations = findStaleDocLinks(`
[Button](/lynx-ui/components/button.html)
[button-reference]: /next/lynx-ui/components/button.html
<a href="/lynx-ui/components/button.html">Button</a>
<Link to='/next/lynx-ui/components/button.html'>Button</Link>
`)

    assert.equal(violations.length, 4)
  })

  it('allows canonical docs, repository URLs, and package paths', () => {
    const violations = findStaleDocLinks(`
https://lynxjs.org/ui/components/button.html
https://lynxjs.org/next/ui/components/button.html
https://github.com/lynx-family/lynx-ui/tree/main/packages/lynx-ui-button
packages/lynx-ui-button/docs/README.mdx
`)

    assert.deepEqual(violations, [])
  })
})
