// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { resolve } from 'node:path'

import ts from 'typescript'

/**
 * Resolves an exported alias to its declaration without losing type-only
 * export semantics. A type-only link means the package entry does not expose
 * the symbol at runtime, even when its underlying declaration is a class.
 * @param checker TypeScript checker for the package entry program.
 * @param symbol Exported symbol to resolve.
 * @param allowTypeOnly Whether type-only export declarations may be resolved.
 * @returns The runtime declaration, or `undefined` for a type-only export.
 */
function resolveExportAlias(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
  allowTypeOnly: boolean,
): ts.Symbol | undefined {
  const visited = new Set<ts.Symbol>()
  let current = symbol

  while (current.flags & ts.SymbolFlags.Alias) {
    if (visited.has(current)) break
    visited.add(current)

    if (
      !allowTypeOnly
      && current.declarations?.some(declaration =>
        ts.isTypeOnlyExportDeclaration(declaration)
      )
    ) {
      return undefined
    }

    const target = checker.getImmediateAliasedSymbol(current)
      ?? checker.getAliasedSymbol(current)
    if (target === current) break
    current = target
  }

  return current
}

/**
 * Collects names that consumers can import as runtime values from a package
 * entry point. The documentation generator uses this set to display
 * `FooProps` as `Foo` only when `Foo` is an actual public component export.
 * @param entryPoint Absolute or workspace-relative package entry path.
 * @returns Public export names backed by runtime values.
 */
export function collectPublicRuntimeExportNames(
  entryPoint: string,
): Set<string> {
  const resolvedEntryPoint = resolve(entryPoint)
  const program = ts.createProgram([resolvedEntryPoint], {
    allowJs: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
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
    const target = resolveExportAlias(checker, exportedSymbol, false)
    if (target && target.flags & ts.SymbolFlags.Value) {
      runtimeExports.add(exportedSymbol.name)
    }
  }

  return runtimeExports
}

/**
 * Collects names that consumers can import as types from a package entry
 * point. Runtime declarations such as classes and enums are included when
 * they also define a public type.
 * @param entryPoint Absolute or workspace-relative package entry path.
 * @returns Public export names backed by type declarations.
 */
export function collectPublicTypeExportNames(
  entryPoint: string,
): Set<string> {
  const resolvedEntryPoint = resolve(entryPoint)
  const program = ts.createProgram([resolvedEntryPoint], {
    allowJs: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
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

  const typeExports = new Set<string>()
  for (const exportedSymbol of checker.getExportsOfModule(moduleSymbol)) {
    const target = resolveExportAlias(checker, exportedSymbol, true)
    if (target && target.flags & ts.SymbolFlags.Type) {
      typeExports.add(exportedSymbol.name)
    }
  }

  return typeExports
}
