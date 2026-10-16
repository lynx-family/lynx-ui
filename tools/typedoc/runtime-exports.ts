// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { resolve } from 'node:path'

import ts from 'typescript'

function resolveAlias(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
): ts.Symbol {
  const visited = new Set<ts.Symbol>()
  let current = symbol

  while (current.flags & ts.SymbolFlags.Alias) {
    if (visited.has(current)) break
    visited.add(current)

    const target = checker.getAliasedSymbol(current)
    if (target === current) break
    current = target
  }

  return current
}

export function collectPublicRuntimeExportNames(
  entryPoint: string,
): Set<string> {
  const resolvedEntryPoint = resolve(entryPoint)
  const program = ts.createProgram([resolvedEntryPoint], {
    allowJs: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true,
    target: ts.ScriptTarget.ESNext,
  })
  const checker = program.getTypeChecker()
  const sourceFile = program.getSourceFile(resolvedEntryPoint)

  if (!sourceFile) {
    throw new Error(`Could not load package entry point: ${resolvedEntryPoint}`)
  }

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile)
  if (!moduleSymbol) {
    throw new Error(
      `Could not resolve package entry point exports: ${resolvedEntryPoint}`,
    )
  }

  const runtimeExports = new Set<string>()
  for (const exportedSymbol of checker.getExportsOfModule(moduleSymbol)) {
    const target = resolveAlias(checker, exportedSymbol)
    if (target.flags & ts.SymbolFlags.Value) {
      runtimeExports.add(exportedSymbol.name)
    }
  }

  return runtimeExports
}
