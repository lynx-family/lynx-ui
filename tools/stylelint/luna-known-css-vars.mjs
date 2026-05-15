import fs from 'node:fs'
import path from 'node:path'

import valueParser from 'postcss-value-parser'
import stylelint from 'stylelint'

const ruleName = 'lynx-ui/luna-known-css-vars'
const messages = stylelint.utils.ruleMessages(ruleName, {
  missingExtraSource: (filePath) =>
    `Extra CSS variable source file does not exist: "${filePath}".`,
  missingSource: (filePath) =>
    `LUNA styles dist file does not exist: "${filePath}". Build @lynx-js/luna-styles first.`,
  unknownVariable: (variableName) =>
    `Unknown LUNA CSS variable "${variableName}".`,
})

function collectImportedFiles(cssText, filePath) {
  const importedFiles = []
  const importMatches = cssText.matchAll(
    /@import\s+(?:url\(\s*)?["']?((?<=')[^']+(?=')|(?<=")[^"]+(?=")|[^"')\s;]+)["']?(?:\s*\))?(?:\s[^;]*)?;/gu,
  )

  for (const match of importMatches) {
    const importPath = match[1]

    if (!importPath.startsWith('.')) {
      continue
    }

    const importedFilePath = path.resolve(path.dirname(filePath), importPath)

    if (fs.existsSync(importedFilePath)) {
      importedFiles.push(importedFilePath)
    }
  }

  return importedFiles
}

function collectDeclaredVariablesFromCssText(cssText) {
  const declaredVariables = new Set()
  const matches = cssText.matchAll(/(^|[;{\s])(--[\w-]+)\s*:/gmu)

  for (const match of matches) {
    declaredVariables.add(match[2])
  }

  return declaredVariables
}

function collectDeclaredVariablesFromCssFile(filePath, visited = new Set()) {
  const resolvedPath = path.resolve(filePath)

  if (visited.has(resolvedPath)) {
    return new Set()
  }

  visited.add(resolvedPath)

  const cssText = fs.readFileSync(resolvedPath, 'utf8')
  const declaredVariables = collectDeclaredVariablesFromCssText(cssText)

  for (const importedFilePath of collectImportedFiles(cssText, resolvedPath)) {
    for (
      const importedVariable of collectDeclaredVariablesFromCssFile(
        importedFilePath,
        visited,
      )
    ) {
      declaredVariables.add(importedVariable)
    }
  }

  return declaredVariables
}

function collectUsedVariables(value) {
  const usedVariables = []
  const parsedValue = valueParser(value)

  parsedValue.walk((node) => {
    if (node.type !== 'function' || node.value !== 'var') {
      return
    }

    const variableNode = node.nodes.find(
      (child) => child.type === 'word' && child.value.startsWith('--'),
    )

    if (variableNode) {
      usedVariables.push(variableNode.value)
    }
  })

  return usedVariables
}

const rule = (primary, secondaryOptions = {}) => {
  return (root, result) => {
    if (!primary) {
      return
    }

    const tokensFile = path.resolve(
      process.cwd(),
      secondaryOptions.tokensFile
        ?? './luna/packages/luna-styles/dist/index.css',
    )

    if (!fs.existsSync(tokensFile)) {
      stylelint.utils.report({
        ruleName,
        result,
        message: messages.missingSource(tokensFile),
        node: root,
      })
      return
    }

    const allowedVariables = collectDeclaredVariablesFromCssFile(tokensFile)
    const extraTokenFiles = secondaryOptions.extraTokenFiles ?? []

    for (const extraTokenFile of extraTokenFiles) {
      const resolvedExtraTokenFile = path.resolve(process.cwd(), extraTokenFile)

      if (!fs.existsSync(resolvedExtraTokenFile)) {
        stylelint.utils.report({
          ruleName,
          result,
          message: messages.missingExtraSource(resolvedExtraTokenFile),
          node: root,
        })
        return
      }

      for (
        const variableName of collectDeclaredVariablesFromCssFile(
          resolvedExtraTokenFile,
        )
      ) {
        allowedVariables.add(variableName)
      }
    }

    const currentFilePath = root.source?.input?.file

    if (currentFilePath && fs.existsSync(currentFilePath)) {
      for (
        const variableName of collectDeclaredVariablesFromCssFile(
          currentFilePath,
        )
      ) {
        allowedVariables.add(variableName)
      }
    } else {
      root.walkDecls((decl) => {
        if (decl.prop.startsWith('--')) {
          allowedVariables.add(decl.prop)
        }
      })
    }

    root.walkDecls((decl) => {
      for (const variableName of collectUsedVariables(decl.value)) {
        if (allowedVariables.has(variableName)) {
          continue
        }

        stylelint.utils.report({
          ruleName,
          result,
          message: messages.unknownVariable(variableName),
          node: decl,
          word: variableName,
        })
      }
    })
  }
}

const plugin = stylelint.createPlugin(ruleName, rule)

plugin.ruleName = ruleName
plugin.messages = messages

export default plugin
export { messages, ruleName }
