// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// Biome 1.9.4 allows both array spellings for these complex element types.
// Neither of Rslint's array or array-simple modes preserves that policy.
const complexTypes = new Set([
  'TSUnionType',
  'TSIntersectionType',
  'TSFunctionType',
  'TSConstructorType',
  'TSConditionalType',
  'TSTypeOperator',
  'TSInferType',
  'TSTypeLiteral',
  'TSMappedType',
])

function arrayArguments(node) {
  if (
    node.type !== 'TSTypeReference'
    || node.typeName.type !== 'Identifier'
    || !['Array', 'ReadonlyArray'].includes(node.typeName.name)
  ) return null
  return (node.typeArguments ?? node.typeParameters)?.params ?? []
}

function canUseShorthand(node, sourceCode) {
  if (complexTypes.has(node.type)) {
    // ESTree drops parenthesized type nodes; Biome treats them separately.
    return sourceCode.getTokenBefore(node)?.value === '('
      && sourceCode.getTokenAfter(node)?.value === ')'
  }
  const nested = arrayArguments(node)
  return nested === null || nested.length === 0
    || nested.some(type => canUseShorthand(type, sourceCode))
}

const biomeCompatPlugin = {
  rules: {
    'array-type': {
      meta: {
        type: 'suggestion',
        schema: [],
        messages: {
          shorthand: 'Use array shorthand for simple element types.',
        },
      },
      create(context) {
        return {
          TSTypeReference(node) {
            const params = arrayArguments(node)
            if (
              params?.some(type => canUseShorthand(type, context.sourceCode))
            ) {
              context.report({ node, messageId: 'shorthand' })
            }
          },
        }
      },
    },
  },
}

export default biomeCompatPlugin
