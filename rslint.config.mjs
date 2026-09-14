// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import noticePlugin from 'eslint-plugin-notice'

import configs from './eslint.config.mjs'

// Polyfill context for plugins that rely on legacy pre-flat-config ESLint context APIs
const origNoticeCreate = noticePlugin.rules.notice.create
noticePlugin.rules.notice.create = function(context) {
  if (typeof context.getFilename !== 'function') {
    context.getFilename = () => context.filename || ''
  }
  if (typeof context.getSourceCode !== 'function') {
    context.getSourceCode = () => context.sourceCode
  }
  return origNoticeCreate.call(this, context)
}

const NATIVE_PLUGINS = new Set([
  '@typescript-eslint',
  'import',
  'jest',
  'jsx-a11y',
  'promise',
  'react',
  'react-hooks',
  'rstest',
  'unicorn',
  'eslint-plugin-import',
  'eslint-plugin-jest',
  'eslint-plugin-jsx-a11y',
  'eslint-plugin-promise',
  'eslint-plugin-react-hooks',
  'eslint-plugin-unicorn',
])

// Adapt ESLint flat configuration for Rslint
const rslintConfigs = configs.map(cfg => {
  const newCfg = { ...cfg }

  // Exclude plugins that are built natively into Rslint to prevent name collisions
  if (cfg.plugins) {
    const newPlugins = {}
    for (const [key, val] of Object.entries(cfg.plugins)) {
      if (!NATIVE_PLUGINS.has(key)) {
        newPlugins[key] = val
      }
    }
    if (Object.keys(newPlugins).length > 0) {
      newCfg.plugins = newPlugins
    } else {
      delete newCfg.plugins
    }
  }

  // Sanitize boolean parserOptions.project (e.g. from tseslint.configs.disableTypeChecked)
  // to align with Rslint Go IPC string-slice schema
  if (newCfg.languageOptions?.parserOptions) {
    const po = { ...newCfg.languageOptions.parserOptions }
    if (typeof po.project === 'boolean') {
      delete po.project
    }
    newCfg.languageOptions = {
      ...newCfg.languageOptions,
      parserOptions: po,
    }
  }

  return newCfg
})

export default rslintConfigs
