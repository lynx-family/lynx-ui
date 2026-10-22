// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as fs from 'node:fs'
import path from 'node:path'

import type { ApiReferenceConfig } from './api-reference-config.js'

function stringifyCommentContent(
  content?: { text?: string }[],
) {
  return content?.map(item => item.text ?? '').join('') ?? ''
}

function getCommentText(comment: any, isZh?: boolean) {
  if (!comment) return ''

  if (isZh) {
    const zhTag = comment.blockTags?.find((tag: any) => tag.tag === '@zh')

    if (zhTag) {
      return stringifyCommentContent(zhTag.content)
    }
  }

  return stringifyCommentContent(comment.summary)
}

function joinTypedocTextParts(
  parts: Array<{ text?: unknown }> | undefined,
): string | null {
  if (!Array.isArray(parts) || parts.length === 0) return null
  const text = parts
    .map((p: { text?: unknown }) => (typeof p?.text === 'string' ? p.text : ''))
    .join('')
    .trim()
  return text.length > 0 ? text : null
}

function getTypedocZhText(node: unknown): string | null {
  const nodeAny = node as any
  const tags = nodeAny?.comment?.blockTags
  if (!Array.isArray(tags)) return null
  const zh = tags.find((t: unknown) =>
    (t as { tag?: unknown } | null)?.tag === '@zh'
  )
  return joinTypedocTextParts(
    (zh as { content?: Array<{ text?: unknown }> } | null)?.content,
  )
}

function tryReadTypedocJsonFromGenDir(
  packageDirName: string,
  isZh?: boolean,
): TypeDocJson | null {
  const langDir = isZh ? 'zh' : 'en'
  const baseDir = path.join(
    process.cwd(),
    'tools',
    'typedoc',
    'gen',
    langDir,
    packageDirName,
  )
  const candidates = ['tsconfig.docs.json', 'tsconfig.json']
  for (const file of candidates) {
    const jsonPath = path.join(baseDir, file)
    if (fs.existsSync(jsonPath)) {
      return JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as TypeDocJson
    }
  }
  return null
}

function findPackageNameFromSavePath(savePath: string): string | null {
  const normalized = savePath.replace(/\\/g, '/')
  const marker = '/packages/'
  const idx = normalized.lastIndexOf(marker)
  if (idx === -1) return null
  const rest = normalized.slice(idx + marker.length)
  const packageDir = rest.split('/')[0]
  return packageDir || null
}

function collectReferencedPackageNames(typedocJson: unknown): Set<string> {
  const packages = new Set<string>()

  const visit = (node: unknown) => {
    if (!node) return
    if (Array.isArray(node)) {
      for (const item of node) visit(item)
      return
    }
    if (typeof node === 'object') {
      const obj = node as Record<string, unknown>
      const target = obj.target as Record<string, unknown> | undefined
      if (
        obj.type === 'reference'
        && target
        && typeof target.packageName === 'string'
      ) {
        packages.add(target.packageName)
      }
      for (const value of Object.values(obj)) visit(value)
    }
  }

  visit(typedocJson)
  return packages
}

interface TypeDocNode extends Record<string, any> {}
interface TypeDocJson {
  children?: TypeDocNode[]
}

let currentTypeDocCandidatesEn: TypeDocJson[] = []
let currentTypeDocCandidatesZh: TypeDocJson[] = []

function buildTypeDocCandidates(
  currentPackageName: string,
  isZh: boolean,
): TypeDocJson[] {
  const currentMeta = tryReadTypedocJsonFromGenDir(currentPackageName, isZh)
  if (!currentMeta) return []

  const candidates: TypeDocJson[] = [currentMeta]
  const referenced = collectReferencedPackageNames(currentMeta)
  for (const fullPkgName of referenced) {
    const dirName = fullPkgName.replace(/^@[^/]+\//, '')
    const meta = tryReadTypedocJsonFromGenDir(dirName, isZh)
    if (meta) candidates.push(meta)
  }

  return candidates
}

function getAllInterfaceNodes(json: TypeDocJson): TypeDocNode[] {
  return Array.isArray(json.children) ? json.children : []
}

function getPropertyNamesOfInterface(node: TypeDocNode): string[] {
  const children = Array.isArray(node?.children) ? node.children : []
  return children
    .map((c: any) => (typeof c?.name === 'string' ? c.name : null))
    .filter(Boolean)
}

function findBestInterfaceByKeys(
  keys: string[],
  candidates: TypeDocJson[],
): TypeDocNode | null {
  const required = new Set(keys)
  let best: { score: number, node: TypeDocNode } | null = null

  for (const json of candidates) {
    for (const node of getAllInterfaceNodes(json)) {
      if (!Array.isArray(node?.children)) continue
      const names = getPropertyNamesOfInterface(node)
      const nameSet = new Set(names)
      let ok = true
      for (const k of required) {
        if (!nameSet.has(k)) {
          ok = false
          break
        }
      }
      if (!ok) continue

      const nodeName = typeof node?.name === 'string' ? node.name : ''
      const extra = names.length - keys.length
      const preferName =
        /(?:RenderProps|AnimationStatus|Status|UIVariants)$/i.test(nodeName)
          ? -10
          : 0
      const score = extra * 10 + preferName

      if (!best || score < best.score) best = { score, node }
    }
  }

  return best?.node ?? null
}

function buildDescriptionsFromInterface(
  iface: TypeDocNode | null,
  isZh: boolean,
): Record<string, string> {
  if (!iface) return {}
  const out: Record<string, string> = {}
  const children = Array.isArray(iface.children) ? iface.children : []
  for (const child of children) {
    const key = typeof child?.name === 'string' ? child.name : null
    if (!key) continue
    const text = isZh
      ? getTypedocZhText(child)
      : joinTypedocTextParts(child?.comment?.summary)
    if (typeof text === 'string' && text.length > 0) out[key] = text
  }
  return out
}

function getStatusDescriptionsForKeys(
  keys: string[],
  isZh: boolean,
): Record<string, string> {
  const candidates = currentTypeDocCandidatesEn
  const iface = findBestInterfaceByKeys(keys, candidates)
  return buildDescriptionsFromInterface(iface, isZh)
}

function getUiVariantDescriptionsForKeys(
  uiKeys: string[],
  isZh: boolean,
): Record<string, string> {
  const candidates = currentTypeDocCandidatesEn
  const iface = findBestInterfaceByKeys(uiKeys, candidates)
  return buildDescriptionsFromInterface(iface, isZh)
}

function getDeclaredUiVariantKeys(): Set<string> {
  const currentPackage = currentTypeDocCandidatesEn[0]
  const keys = new Set<string>()
  if (!currentPackage) return keys

  for (const node of getAllInterfaceNodes(currentPackage)) {
    const nodeName = typeof node?.name === 'string' ? node.name : ''
    if (!nodeName.toLowerCase().endsWith('uivariants')) continue

    for (const name of getPropertyNamesOfInterface(node)) {
      if (name.startsWith('ui-')) keys.add(name)
    }
  }

  return keys
}

export function getDefaultUiVariantDescription(
  renderPropKey: string,
  propType: unknown,
): string {
  if (
    typeof propType === 'string'
    && propType.split('|').some(type => type.trim() === 'null')
  ) {
    return `Applied when \`status.${renderPropKey}\` is not \`null\`.`
  }
  return `Applied when \`status.${renderPropKey}\` is true.`
}

function isRenderFunctionChildrenProp(prop: unknown): boolean {
  const p = prop as { name?: unknown, type?: unknown } | null
  if (!p || p.name !== 'children') return false
  const typeText = typeof (p as any)?.type === 'string' ? (p as any).type : ''
  const fallbackText = (p as any)?.docTypeFallback?.content?.[0]?.text
  const effectiveType =
    typeof fallbackText === 'string' && fallbackText.length > 0
      ? fallbackText
      : typeText
  if (typeof effectiveType !== 'string' || effectiveType.length === 0) {
    return false
  }

  // Only treat "status render props" like:
  // `ReactNode | (status: SwitchRenderProps) => ReactNode`
  // `ReactNode | (status: { ... }) => ReactNode`
  // This avoids mis-classifying other function children (e.g. Sortable).
  return /\(\s*(?:status|state)\s*:/.test(effectiveType)
    && /=>\s*ReactNode/.test(effectiveType)
}

function findInterfaceByName(
  name: string,
  candidates: TypeDocJson[],
): TypeDocNode | null {
  for (const json of candidates) {
    for (const node of getAllInterfaceNodes(json)) {
      if (node?.name === name && Array.isArray(node?.children)) {
        return node
      }
    }
  }
  return null
}

function formatTypeFromTypedocType(t: any): string {
  if (!t) return 'unknown'
  if (typeof t === 'string') return t
  if (typeof t?.name === 'string') return t.name
  if (t?.type === 'intrinsic' && typeof t?.name === 'string') return t.name
  if (t?.type === 'reference' && typeof t?.name === 'string') return t.name
  if (t?.type === 'array' && t?.elementType) {
    return `${formatTypeFromTypedocType(t.elementType)}[]`
  }
  if (t?.type === 'union' && Array.isArray(t?.types)) {
    return t.types.map((x: any) => formatTypeFromTypedocType(x)).join(' | ')
  }
  return 'unknown'
}

function extractRenderFunctionTableSource(
  prop: unknown,
  isZh?: boolean,
): Array<Record<string, unknown>> {
  const p = prop as { type?: unknown } | null
  if (!p) return []
  const typeText = typeof (p as any)?.type === 'string' ? (p as any).type : ''
  const fallbackText = (p as any)?.docTypeFallback?.content?.[0]?.text
  const effectiveType =
    typeof fallbackText === 'string' && fallbackText.length > 0
      ? fallbackText
      : typeText
  if (typeof effectiveType !== 'string' || effectiveType.length === 0) return []

  // Inline object literal: `(status: { a: boolean; ... }) => ReactNode`
  const inline = /\(\s*(?:status|state)\s*:\s*\{([^}]*)\}\)\s*=>/.exec(
    effectiveType,
  )
  if (inline) {
    const keys = inline[1]
      .split(/[;,]/)
      .map(item => item.trim())
      .filter(Boolean)
      .map(item => item.split(':')[0])
      .map(namePart => namePart?.replace(/\?/g, '').trim())
      .filter(Boolean)

    const descriptionsEn = getStatusDescriptionsForKeys(keys, false)
    const descriptionsZh = getStatusDescriptionsForKeys(keys, true)

    const mapped = (inline[1]
      .split(/[;,]/)
      .map(item => item.trim())
      .filter(Boolean)
      .map(item => {
        const [namePart, typePart] = item.split(':')
        if (!namePart || !typePart) return null
        const propName = namePart.replace(/\?/g, '').trim()
        const propType = typePart.trim()
        return {
          className: `ui-${propName}`,
          'Render Prop': propName,
          item: {
            type: propType,
            description: descriptionsEn[propName]
              ?? `Render function state: ${propName}.`,
            description_zh: descriptionsZh[propName] || undefined,
          },
        }
      })) as Array<Record<string, unknown> | null>

    return mapped.filter((x): x is Record<string, unknown> => x !== null)
  }

  // Referenced status type: `(status: SwitchRenderProps) => ReactNode`
  const ref = /\(\s*(?:status|state)\s*:\s*([\w$.]+)\s*\)\s*=>/.exec(
    effectiveType,
  )
  if (!ref) return []
  const statusTypeName = ref[1]

  const ifaceEn = findInterfaceByName(
    statusTypeName,
    currentTypeDocCandidatesEn,
  )
  const children = Array.isArray(ifaceEn?.children) ? ifaceEn.children : []

  const descriptionsEn = buildDescriptionsFromInterface(ifaceEn, false)
  const descriptionsZh = buildDescriptionsFromInterface(ifaceEn, true)

  const mapped = children.map((child: any) => {
    const propName = typeof child?.name === 'string' ? child.name : null
    if (!propName) return null
    const propType = formatTypeFromTypedocType(child?.type)
    return {
      className: `ui-${propName}`,
      'Render Prop': propName,
      item: {
        type: propType,
        description: descriptionsEn[propName]
          ?? `Render function state: ${propName}.`,
        description_zh: descriptionsZh[propName] || undefined,
      },
    }
  }) as Array<Record<string, unknown> | null>

  return mapped.filter((x): x is Record<string, unknown> => x !== null)
}

function mergeRenderPropsAndUiVariants(
  renderPropItems: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  const declaredUiVariantKeys = getDeclaredUiVariantKeys()
  const variantItems = declaredUiVariantKeys.size > 0
    ? renderPropItems.filter((item: Record<string, unknown>) => {
      const className = item?.className
      return typeof className === 'string'
        && declaredUiVariantKeys.has(className)
    })
    : renderPropItems
  const uiKeys = variantItems
    .map((item: Record<string, unknown>) => item?.className)
    .filter((c: unknown): c is string => typeof c === 'string')

  const uiVariantDescriptionsEn = getUiVariantDescriptionsForKeys(uiKeys, false)
  const uiVariantDescriptionsZh = getUiVariantDescriptionsForKeys(uiKeys, true)
  return variantItems.map((item: Record<string, unknown>) => {
    const className = item?.className
    const classNameStr = typeof className === 'string' ? className : ''
    const renderPropKey = typeof item?.['Render Prop'] === 'string'
      ? item['Render Prop']
      : null
    const renderPropType = (item as any)?.item?.type

    const uiDescEn = classNameStr.length > 0
      ? (uiVariantDescriptionsEn[classNameStr]
        ?? (renderPropKey
          ? getDefaultUiVariantDescription(renderPropKey, renderPropType)
          : undefined))
      : undefined
    const uiDescZh = classNameStr.length > 0
      ? uiVariantDescriptionsZh[classNameStr]
      : undefined

    const baseDescEn = (item as any)?.item?.description as string | undefined
    const baseDescZh = (item as any)?.item?.description_zh as string | undefined

    const mergedDescEn = uiDescEn
      ? `${baseDescEn ?? ''}\n${uiDescEn}`.trim()
      : baseDescEn
    const mergedDescZh = uiDescZh
      ? `${baseDescZh ?? ''}\n${uiDescZh}`.trim()
      : baseDescZh

    return {
      ...item,
      item: {
        ...(item as any).item,
        description: mergedDescEn,
        description_zh: mergedDescZh ?? undefined,
      },
    }
  })
}

/**
 * Composes independently generated MDX sections with deterministic boundaries.
 *
 * Only section edges are trimmed. Whitespace inside a section, including
 * authored comments and code examples, is preserved.
 */
function joinMdxSections(
  sections: Array<string | null | undefined>,
): string {
  return sections
    .filter((section): section is string =>
      typeof section === 'string' && section.trim().length > 0
    )
    .map(section => section.trim())
    .join('\n\n')
}

function toApiAnchorSegment(title: string): string {
  return title
    .trim()
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

/**
 * Formats a generated API heading with an explicit namespace. Nested entity
 * anchors include their owning section.
 * @param marker Markdown heading level.
 * @param title Visible heading title.
 * @param parentTitle Owning API entity for a nested group.
 * @returns A Markdown heading with a stable explicit anchor.
 */
function formatApiHeading(
  marker: '###' | '####',
  title: string,
  parentTitle?: string,
): string {
  const anchor = ['api', parentTitle, title]
    .filter((segment): segment is string => Boolean(segment))
    .map(segment => toApiAnchorSegment(segment))
    .join('-')
  return `${marker} ${title} {#${anchor}}`
}

/**
 * Uses a component name as the display title for its documented props only
 * when the package root exports that component as a runtime value. Other
 * `*Props` declarations retain their source names.
 * @param data TypeDoc entity to display.
 * @param publicRuntimeExportNames Runtime values exported by the package root.
 * @returns The entity with its public component title when applicable.
 */
function withApiEntityDisplayTitle(
  data: any,
  publicRuntimeExportNames: ReadonlySet<string>,
) {
  if (!data || typeof data.title !== 'string') return data
  if (!data.title.endsWith('Props')) return data

  const runtimeExportName = data.title.slice(0, -'Props'.length)
  if (!publicRuntimeExportNames.has(runtimeExportName)) return data

  return {
    ...data,
    title: runtimeExportName,
  }
}

/**
 * Generates one props section and its API tables.
 *
 * Render-function children receive an additional state table and localized
 * preamble, while ordinary props remain in the primary API table.
 */
function genProps(
  data: any,
  isZh?: boolean,
  headingMarker: '###' | '####' = '###',
  parentTitle?: string,
) {
  const title = data.title
  const children = data.children
  const comments = getCommentText(data.comment, isZh)

  if (!children?.length) return ''

  const shouldLabelGroups =
    children.some((child: any) => child.title === 'Properties')
    && children.some((child: any) => child.title === 'Events')
  const sections = [
    formatApiHeading(headingMarker, title, parentTitle),
    comments,
  ]

  children.map((d: any) => {
    const rawItems = Array.isArray(d.children) ? d.children : []
    const renderChildren = rawItems.filter((item: unknown) =>
      isRenderFunctionChildrenProp(item)
    )
    const normalItems = rawItems.filter((item: unknown) => {
      if (isRenderFunctionChildrenProp(item)) return false
      return true
    })

    const sourceString = JSON.stringify(normalItems, null, 2)
    const titleProp = shouldLabelGroups
      ? ` title=${JSON.stringify(d.title)}`
      : ''
    sections.push(
      `<UIApiTable${titleProp} source={${sourceString}}/>`,
    )

    if (renderChildren.length > 0) {
      const renderSourceString = JSON.stringify(renderChildren, null, 2)
      const renderPropItemsRaw = renderChildren.flatMap((item: unknown) =>
        extractRenderFunctionTableSource(item, isZh)
      )
      const mergedTableSource = JSON.stringify(
        mergeRenderPropsAndUiVariants(renderPropItemsRaw),
        null,
        2,
      )

      // Inject a single-tag reference to <ClassRenderPropPreamble />. The actual
      // component (which picks the current locale via Rspress's `useLang()` hook
      // and renders the corresponding copy) is defined once at the top of every
      // generated APIReference.mdx that contains at least one ClassRenderPropTable.
      const classRenderPropPreamble = `<ClassRenderPropPreamble />`

      sections.push(
        `<UIApiTable source={${renderSourceString}}/>`,
        classRenderPropPreamble,
        `<ClassRenderPropTable source={${mergedTableSource}}/>`,
      )
    }
  })
  return joinMdxSections(sections)
}

/** Generates the public ref API section from TypeDoc method groups. */
function genRef(data: any, isZh?: boolean) {
  const title = data.title
  const children = data.children
  const comments = getCommentText(data.comment, isZh)

  if (!children?.length) return ''

  return joinMdxSections([
    formatApiHeading('###', title),
    comments,
    ...children.map((d: any) => {
      const sourceString = JSON.stringify(d.children, null, 2)
      return `<UIApiTable source={${sourceString}}/>`
    }),
  ])
}

/** Generates an API table for a documented type alias. */
function genTypeAlias(
  data: any,
  headingMarker: '###' | '####' = '###',
  parentTitle?: string,
) {
  if (!data.typeAlias) return ''

  const sourceString = JSON.stringify([data.typeAlias], null, 2)
  return joinMdxSections([
    formatApiHeading(headingMarker, data.title, parentTitle),
    `<UIApiTable source={${sourceString}}/>`,
  ])
}

/**
 * Generates one API reference fragment from serialized TypeDoc data.
 *
 * Top-level entities are generated independently so joinMdxSections remains
 * the single owner of structural whitespace between the header and sections.
 */
const doGenTplWithData = async (
  dataPath: string,
  savePath: string,
  apiConfig: ApiReferenceConfig,
  publicRuntimeExportNames: ReadonlySet<string> = new Set(),
) => {
  const dataString = fs.readFileSync(dataPath, 'utf-8')
  const data = JSON.parse(dataString)
  const isZh = savePath.includes('zh')

  const currentPkg = findPackageNameFromSavePath(savePath)
  currentTypeDocCandidatesEn = currentPkg
    ? buildTypeDocCandidates(currentPkg, false)
    : []
  currentTypeDocCandidatesZh = currentPkg
    ? buildTypeDocCandidates(currentPkg, true)
    : []

  // Keep component parts, refs, and supporting types in their configured
  // groups and display order.
  const partOrder = new Map(
    apiConfig.parts.map((name, index) => [`${name}Props`, index]),
  )
  const refOrder = new Map(
    (apiConfig.refs ?? []).map((name, index) => [name, index]),
  )
  const supportingTypeOrder = new Map(
    (apiConfig.supportingTypes ?? [])
      .map((name, index) => [name, index]),
  )
  const missingOrder = Number.MAX_SAFE_INTEGER
  const getConfiguredOrder = (title: string) => {
    return partOrder.get(title)
      ?? refOrder.get(title)
      ?? supportingTypeOrder.get(title)
      ?? missingOrder
  }
  const getEntityRank = (item: any) => {
    if (partOrder.has(item.title)) return 0
    if (refOrder.has(item.title)) return 1
    return 2
  }

  const serializedEntityNames = new Set(
    data.children.map((item: any) => item.title),
  )
  const missingConfiguredEntities = [
    ...(apiConfig.refs ?? []),
    ...(apiConfig.supportingTypes ?? []),
    ...(apiConfig.embeddedTypes ?? []),
  ].filter(title => !serializedEntityNames.has(title))
  if (missingConfiguredEntities.length > 0) {
    throw new Error(
      `Configured API entities were not serialized: ${
        missingConfiguredEntities.join(', ')
      }`,
    )
  }

  const sortedData = data.children.sort((a: any, b: any) => {
    const rankDifference = getEntityRank(a) - getEntityRank(b)
    if (rankDifference !== 0) return rankDifference

    const configuredOrderDifference = getConfiguredOrder(a.title)
      - getConfiguredOrder(b.title)
    if (configuredOrderDifference !== 0) {
      return configuredOrderDifference
    }

    return 0
  })

  // If a component consumes render-props via `children`, hide the corresponding
  // standalone `*RenderProps` interface section to match Dialog-style docs.
  const renderPropsTitlesToSkip = new Set<string>()
  if (Array.isArray(sortedData)) {
    const getInterfacePropItems = (ifaceItem: any): any[] => {
      const groups = Array.isArray(ifaceItem?.children)
        ? ifaceItem.children
        : []
      const propsGroup = groups.find((g: any) => g?.title === 'Properties')
      return Array.isArray(propsGroup?.children) ? propsGroup.children : []
    }

    const extractRenderPropKeysFromChildrenProp = (prop: any): string[] => {
      if (!prop || typeof prop.type !== 'string') return []
      const match = /\(\s*status\s*:\s*\{([^}]*)\}\)\s*=>/.exec(prop.type)
      if (!match) return []
      return match[1]
        .split(';')
        .map((s: string) => s.trim())
        .filter(Boolean)
        .map((s: string) => s.split(':')[0]?.replace(/\?/g, '').trim())
        .filter(Boolean)
    }

    for (const item of sortedData) {
      if (typeof item?.title !== 'string') continue
      if (!item.title.endsWith('Props')) continue
      const props = getInterfacePropItems(item)
      const childrenProp = props.find((p: any) => p?.name === 'children')
      if (!isRenderFunctionChildrenProp(childrenProp)) continue
      const keys = extractRenderPropKeysFromChildrenProp(childrenProp)
      if (keys.length === 0) continue

      for (const candidate of sortedData) {
        if (typeof candidate?.title !== 'string') continue
        if (!candidate.title.endsWith('RenderProps')) continue
        const candidateProps = getInterfacePropItems(candidate)
        const candidateKeys = candidateProps
          .map((p: any) => p?.name)
          .filter((n: any) => typeof n === 'string')
        const candidateKeySet = new Set(candidateKeys)
        const ok = keys.every((k) => candidateKeySet.has(k))
        if (ok) renderPropsTitlesToSkip.add(candidate.title)
      }
    }
  }

  const saveDir = savePath.substring(0, savePath.lastIndexOf('/'))
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true })
  }

  // Shared MDX header injected into every generated APIReference.mdx.
  //
  // `ClassRenderPropPreamble` is a locale-aware wrapper component (now owned
  // by the `@lynx-ui` entry, not this repository) that is rendered
  // above every <ClassRenderPropTable/> in the body. We always import it
  // eagerly here and strip it from the import statement at the end if the
  // generated body does not actually use it, so components without any
  // render-prop table don't ship an unused import.
  const mdxHeader =
    'import { UIApiTable, ClassRenderPropTable, ClassRenderPropPreamble } from "@lynx-ui";'

  // Keep top-level fragments unjoined until every configured entity is
  // filtered and supporting types have been nested under their shared section.
  const primarySections: string[] = []
  const supportingSections: string[] = []

  for (const item of sortedData) {
    if (renderPropsTitlesToSkip.has(item.title)) continue

    const isPart = partOrder.has(item.title)
    const isRef = refOrder.has(item.title)
    const isSupportingType = supportingTypeOrder.has(item.title)
    if (!isPart && !isRef && !isSupportingType) continue

    const displayItem = withApiEntityDisplayTitle(
      item,
      publicRuntimeExportNames,
    )
    const headingMarker = '###'
    const parentTitle = isSupportingType ? 'Supporting Types' : undefined
    let section = ''

    if (isRef) {
      section = genRef(displayItem, isZh)
    } else if (item.typeAlias) {
      section = genTypeAlias(displayItem, headingMarker, parentTitle)
    } else if (item.children?.length) {
      section = genProps(
        displayItem,
        isZh,
        headingMarker,
        parentTitle,
      )
    }

    if (!section) continue
    if (isSupportingType) {
      supportingSections.push(section)
    } else {
      primarySections.push(section)
    }
  }

  const componentApiBody = joinMdxSections(primarySections)
  const supportingTypesBody = joinMdxSections(supportingSections)
  let content = joinMdxSections([
    mdxHeader,
    componentApiBody ? '## Component API {#api}' : '',
    componentApiBody,
    supportingTypesBody
      ? '## Supporting Types {#api-supporting-types}'
      : '',
    supportingTypesBody,
  ])

  // Drop `ClassRenderPropPreamble` from the import statement when the body
  // does not reference it, so components without any render-prop state do
  // not pull in an unused symbol.
  if (!content.includes('<ClassRenderPropPreamble />')) {
    content = content.replace(
      'import { UIApiTable, ClassRenderPropTable, ClassRenderPropPreamble } from "@lynx-ui";',
      'import { UIApiTable, ClassRenderPropTable } from "@lynx-ui";',
    )
  }

  fs.writeFileSync(savePath, `${content}\n`)
}

export { doGenTplWithData }
