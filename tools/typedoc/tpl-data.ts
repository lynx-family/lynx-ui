// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable unicorn/no-negated-condition */
/* eslint-disable no-extra-boolean-cast */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable regexp/no-useless-lazy */
/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable no-useless-catch */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-prototype-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prefer-const */
import * as fs from 'node:fs'
import path from 'node:path'

import { ReflectionKind } from 'typedoc'

const doGetTagContent = (tagObject: any): any[] => {
  return Array.isArray(tagObject?.content) ? tagObject.content : []
}
interface TypeDocJson {
  children?: any[]
  symbolIdMap?: Record<string, { packageName?: string, qualifiedName?: string }>
}

interface ExternalTypeContext {
  idMap: Map<number, any>
  symbolMap: Map<string, number>
}

const externalTypeContextCache = new Map<string, ExternalTypeContext | null>()

function buildIdMap(root: unknown): Map<number, any> {
  const map = new Map<number, any>()
  const visit = (node: any) => {
    if (!node) return
    if (Array.isArray(node)) {
      for (const item of node) visit(item)
      return
    }
    if (typeof node === 'object') {
      if (typeof node.id === 'number') map.set(node.id, node)
      for (const value of Object.values(node)) visit(value)
    }
  }
  visit(root)
  return map
}

function buildSymbolMap(
  symbolIdMap:
    | Record<string, { packageName?: string, qualifiedName?: string }>
    | undefined,
): Map<string, number> {
  const map = new Map<string, number>()
  if (!symbolIdMap) return map
  for (const [id, symbol] of Object.entries(symbolIdMap)) {
    if (!symbol?.packageName || !symbol?.qualifiedName) continue
    map.set(`${symbol.packageName}::${symbol.qualifiedName}`, Number(id))
  }
  return map
}

function findExternalTypedocJsonPath(
  packageName: string,
  isZh: boolean,
): string | null {
  const normalized = packageName.replace(/^@[^/]+\//, '')
  const langDir = isZh ? 'zh' : 'en'
  const baseDir = path.join(
    process.cwd(),
    'tools',
    'typedoc',
    'gen',
    langDir,
    normalized,
  )
  const candidates = ['tsconfig.docs.json', 'tsconfig.json']
  for (const file of candidates) {
    const jsonPath = path.join(baseDir, file)
    if (fs.existsSync(jsonPath)) return jsonPath
  }
  return null
}

function getExternalTypeContext(
  packageName: string,
  isZhContext: boolean,
): ExternalTypeContext | null {
  const cacheKey = `${packageName}::${isZhContext ? 'zh' : 'en'}`
  if (externalTypeContextCache.has(cacheKey)) {
    return externalTypeContextCache.get(cacheKey) ?? null
  }

  const jsonPath = findExternalTypedocJsonPath(packageName, isZhContext)
  const normalized = packageName.replace(/^@[^/]+\//, '')
  if (!jsonPath) {
    console.warn(
      `[TypeDoc Warning] Pre-generated TypeDoc JSON for ${normalized} not found. `
        + `Please ensure you run TypeDoc for ${normalized} before the dependents.`,
    )
    externalTypeContextCache.set(cacheKey, null)
    return null
  }

  const typedocData = JSON.parse(
    fs.readFileSync(jsonPath, 'utf8'),
  ) as TypeDocJson
  const context = {
    idMap: buildIdMap(typedocData),
    symbolMap: buildSymbolMap(typedocData.symbolIdMap),
  }
  externalTypeContextCache.set(cacheKey, context)
  return context
}

function doCalcObjectLiteralType(
  children: any[],
  isZhContext: boolean,
  currentPkgName?: string,
): string {
  const items = children
    .map((c: any) => {
      const name = typeof c?.name === 'string' ? c.name : null
      if (!name) return null
      const isOptional = Boolean(c?.flags?.isOptional)
      const t = c?.type
        ? doTypeCalc(c.type, isZhContext, currentPkgName)
        : 'unknown'
      return `${name}${isOptional ? '?: ' : ': '}${t}`
    })
    .filter(Boolean)
  return `{${items.join(', ')}}`
}

/**
 * A list of type names that should NOT be recursively inlined.
 * Inlining these massive or deeply nested base interfaces (like ViewProps)
 * results in unreadable, infinitely nested JSON structures in the documentation.
 */
const EXCLUDED_INLINE_TYPES = [
  'OverlayViewProps',
  'ViewProps',
  'OverlayProps',
  'BounceConfig',
]

function tryInlineReferenceType(
  t: any,
  isZhContext: boolean,
  currentPkgName?: string,
): string | null {
  const target = t?.target
  const name = typeof t?.name === 'string' ? t.name : ''

  if (EXCLUDED_INLINE_TYPES.includes(name)) {
    return null
  }

  // Only attempt to inline cross-package references
  const targetPackage = target && typeof target === 'object'
    ? (target as { packageName?: unknown } | null)?.packageName
    : undefined

  const pkgName = typeof targetPackage === 'string'
    ? targetPackage
    : currentPkgName

  const isExternalPackage = typeof pkgName === 'string'
    && pkgName.startsWith('@lynx-js/lynx-ui-')
    && pkgName !== '@lynx-js/lynx-ui-common'
  if (!isExternalPackage) return null

  const ctx = getExternalTypeContext(pkgName, isZhContext)
  if (!ctx) return null

  let targetId: number | null = null
  if (typeof target === 'number') {
    targetId = target
  } else if (target && typeof target === 'object') {
    const qualifiedName = (target as { qualifiedName?: unknown } | null)
      ?.qualifiedName
    if (typeof qualifiedName === 'string') {
      targetId = ctx.symbolMap.get(`${pkgName}::${qualifiedName}`) ?? null
    }
  }

  if (targetId === null) return null
  const decl = ctx.idMap.get(targetId)
  if (!decl) return null

  const declType = decl?.type
  if (declType?.type === 'reflection' && declType?.declaration?.signatures) {
    return doTypeCalc(declType, isZhContext, pkgName)
  }
  if (Array.isArray(decl?.children) && decl.children.length > 0) {
    return doCalcObjectLiteralType(decl.children, isZhContext, pkgName)
  }

  return null
}

const doFindObjectWithTagValue = (obj: any, tagName: any, tagValue: any) => {
  function recursiveSearch(currentObj: any): any {
    for (let key in currentObj) {
      if (currentObj.hasOwnProperty(key)) {
        if (key === tagName && currentObj[key] === tagValue) {
          return currentObj
        }
        if (typeof currentObj[key] === 'object' && currentObj[key] !== null) {
          let result: any = recursiveSearch(currentObj[key])
          if (result) {
            return result
          }
        }
      }
    }
    return null
  }

  return recursiveSearch(obj)
}

const doFindObjectWithTag = (obj: any, tagName: any) => {
  function recursiveSearch(currentObj: any): any {
    for (let key in currentObj) {
      if (currentObj.hasOwnProperty(key)) {
        if (key === tagName) {
          return currentObj[key]
        }
        if (typeof currentObj[key] === 'object' && currentObj[key] !== null) {
          let result: any = recursiveSearch(currentObj[key])
          if (result) {
            return result
          }
        }
      }
    }
    return null
  }

  return recursiveSearch(obj)
}

const doSingleTypeCalc = (
  t: any,
  isZhContext: boolean,
  currentPkgName?: string,
) => {
  try {
    const { type, name } = t

    switch (type) {
      case 'intrinsic':
      case 'reference': {
        const inlined = tryInlineReferenceType(t, isZhContext, currentPkgName)
        return inlined ?? name
      }
      case 'array':
        return `${t.elementType.name}[]`
      case 'literal':
        return t.value
      case 'templateLiteral':
        return t.head + t.tail?.map((ti: any) => ti?.[1]).join(',')
      default:
        return t
    }
  } catch (e) {
    throw e
  }
}

const doCalcSingleParam = (
  p: any,
  isZhContext: boolean,
  currentPkgName?: string,
) => {
  return `${p.name}: ${doTypeCalc(p.type, isZhContext, currentPkgName)}`
}

const doCalcParams = (
  params: any,
  isZhContext: boolean,
  currentPkgName?: string,
) => {
  return params?.length
    ? params.map((p: any) => doCalcSingleParam(p, isZhContext, currentPkgName))
      .join(', ')
    : ''
}

const doCalcUnionType = (
  types: any,
  isZhContext: boolean,
  currentPkgName?: string,
) => {
  try {
    return types.map((t: any) =>
      doSingleTypeCalc(t, isZhContext, currentPkgName)
    ).join(' | ')
  } catch (e) {
    throw e
  }
}

const doCalcReflectionType = (
  declaration: any,
  isZhContext: boolean,
  currentPkgName?: string,
) => {
  try {
    if (declaration.signatures) {
      const { parameters, type } = declaration.signatures?.[0]

      return `(${doCalcParams(parameters, isZhContext, currentPkgName)}) => ${
        doSingleTypeCalc(type, isZhContext, currentPkgName)
      }`
    }

    return 'Record<string, unknown>'
  } catch (e) {
    throw e
  }
}

const doTypeCalc = (
  t: any,
  isZhContext: boolean,
  currentPkgName?: string,
): any => {
  try {
    const { type, name, types, declaration } = t

    switch (type) {
      case 'intrinsic':
      case 'reference': {
        const inlined = tryInlineReferenceType(t, isZhContext, currentPkgName)
        return inlined ?? name
      }
      case 'array':
        return `${t.elementType.name}[]`
      case 'tuple':
        return `[${
          t.elements.map((element: any) =>
            doTypeCalc(element, isZhContext, currentPkgName)
          ).join(', ')
        }]`
      case 'typeOperator':
        return `${t.operator} ${
          doTypeCalc(t.target, isZhContext, currentPkgName)
        }`
      case 'templateLiteral':
        return t.head + t.tail?.map((ti: any) => ti?.[1]).join(',')
      case 'union':
        return doCalcUnionType(types, isZhContext, currentPkgName)
      case 'reflection':
        return doCalcReflectionType(declaration, isZhContext, currentPkgName)
      default:
        return t
    }
  } catch (e) {
    console.log(e)

    return t
  }
}

const doGetDefaultBaseValueString = (singleContent: string) => {
  const regex = /ts\n(.*?)\n/
  const match = regex.exec(singleContent)

  if (match) {
    const extractedContent = match[1]

    return extractedContent
  } else {
    return ''
  }
}

const doGetDefaultComplexValueString = (singleContent: string) => {
  const regex = /`(.*?)`/
  const match = regex.exec(singleContent)

  if (match) {
    const extractedContent = match[1]

    return extractedContent
  } else {
    return ''
  }
}

const doDefaultValueCalc = (defaultValue: any) => {
  if (!defaultValue) return ''

  const { content } = defaultValue

  return content
    ?.map((c: any) => {
      const formatValue = doGetDefaultBaseValueString(c.text)
        || doGetDefaultComplexValueString(c.text)

      return formatValue
    })
    .join(',')
}

const doMoreForItem = (item: any, currentPkgName?: string) => {
  const { name, type } = item
  // 是否可选
  const isOption = !!doFindObjectWithTagValue(item, 'isOptional', true)
    ? true
    : false
  // 支持 iOS
  const isSupportIOS = !!doFindObjectWithTagValue(item, 'tag', '@iOS')
    ? true
    : false
  // 支持 Android
  const isSupportAndroid = !!doFindObjectWithTagValue(item, 'tag', '@Android')
    ? true
    : false
  // 支持 Harmony
  const isSupportHarmony = !!doFindObjectWithTagValue(item, 'tag', '@Harmony')
    ? true
    : false
  // 描述信息
  const summary = doFindObjectWithTag(item, 'summary') ?? []
  // 中文描述信息
  const summary_zh_tag = doFindObjectWithTagValue(item, 'tag', '@zh')
  const summary_zh = summary_zh_tag
    ? doGetTagContent(summary_zh_tag)
    : []
  // 默认值
  const defaultValue = doFindObjectWithTagValue(item, 'tag', '@defaultValue')
  // typeDoc 复杂类型的 fallback 处理
  const docTypeFallback = doFindObjectWithTagValue(
    item,
    'tag',
    '@docTypeFallback',
  )
  const fallbackType = doGetTagContent(docTypeFallback)
    .map((content: any) => content?.text ?? '')
    .join('')
    .trim()

  return {
    name,
    type: fallbackType || doTypeCalc(type, false, currentPkgName),
    summary,
    summary_zh,
    defaultValue: doDefaultValueCalc(defaultValue),
    isOption,
    isSupportIOS,
    isSupportAndroid,
    isSupportHarmony,
    docTypeFallback,
  }
}

const doGetChildren = (
  groupsRoot: { title: string, children: number[] }[],
  childrenRoot: Record<string, unknown>[],
  flag: string,
  currentPkgName?: string,
): any[] => {
  return groupsRoot?.map((g: any) => {
    const { title, children } = g
    const targetChildren = childrenRoot.filter((c: any) =>
      children.includes(c.id)
    )

    const formatChildren = targetChildren.map((f: any) => {
      if (f.groups && f.children) {
        return doGetChildren(
          f.groups as { title: string, children: number[] }[],
          f.children as Record<string, unknown>[],
          flag + '#',
          currentPkgName,
        )
      }

      return doMoreForItem(f, currentPkgName)
    })

    return {
      title,
      flag,
      children: formatChildren,
    }
  })
}

const doGenDocData = async (
  jsonPath: string,
  savePath: string,
  hasMultipleProps?: boolean,
  currentPkgName?: string,
) => {
  if (fs.existsSync(jsonPath)) {
    try {
      const content = fs.readFileSync(jsonPath, 'utf8')
      const typedocData: any = JSON.parse(content)
      if (hasMultipleProps) {
        const checkIndexTargetGroup = typedocData.groups?.filter(
          (g: any) =>
            g.title === '接口' || g.title === 'Interfaces'
            || g.title === 'Type Aliases',
        )

        const rootTitle = checkIndexTargetGroup?.title ?? ''
        const checkArray = checkIndexTargetGroup.reduce(
          (acc: any[], item: any) => {
            return acc.concat(item.children) as number[]
          },
          [],
        )

        const rootArray = typedocData.children.filter((c: any) =>
          checkArray?.includes(c.id)
        )

        rootArray.sort((a: any, b: any) => {
          if (a.name.endsWith('Props')) {
            return -1
          } else if (b.name.endsWith('Props')) {
            return 1
          } else if (a.name.endsWith('Ref')) {
            return -1
          } else if (b.name.endsWith('Ref')) {
            return 1
          } else {
            return 0
          }
        })

        const rootFlag = '##'

        const docData = {
          title: rootTitle,
          flag: rootFlag,
          children: rootArray?.map((ra: any) => {
            return {
              title: ra.name,
              flag: rootFlag + '##',
              comment: ra.comment,
              typeAlias: ra.kind === ReflectionKind.TypeAlias
                ? doMoreForItem(ra, currentPkgName)
                : undefined,
              children: doGetChildren(
                ra.groups as {
                  title: string
                  flag: string
                  children: number[]
                }[],
                ra.children as Record<string, unknown>[],
                rootFlag + '##',
                currentPkgName,
              ),
            }
          }),
        }
        fs.writeFileSync(savePath, JSON.stringify(docData, null, 2))
      } else {
        const checkIndexTargetGroup = typedocData.groups?.filter(
          (g: any) => g.title === '接口' || g.title === 'Interfaces',
        )?.[0]

        const rootTitle = checkIndexTargetGroup?.title ?? ''
        const checkArray = checkIndexTargetGroup?.children ?? []

        const rootArray = typedocData.children.filter((c: any) =>
          checkArray?.includes(c.id)
        )

        rootArray.sort((a: any, b: any) => {
          if (a.name.endsWith('Props')) {
            return -1
          } else if (b.name.endsWith('Props')) {
            return 1
          } else if (a.name.endsWith('Ref')) {
            return -1
          } else if (b.name.endsWith('Ref')) {
            return 1
          } else {
            return 0
          }
        })

        const rootFlag = '##'

        const docData = {
          title: rootTitle,
          flag: rootFlag,
          children: rootArray?.map((ra: any) => {
            return {
              title: ra.name,
              flag: rootFlag + '#',
              children: doGetChildren(
                ra.groups as {
                  title: string
                  flag: string
                  children: number[]
                }[],
                ra.children as Record<string, unknown>[],
                rootFlag + '##',
                currentPkgName,
              ),
            }
          }),
        }

        fs.writeFileSync(savePath, JSON.stringify(docData, null, 2))
      }
    } catch (e) {
      console.log(e)

      return !!0
    }
  }

  return !!0
}

export { doGenDocData }
