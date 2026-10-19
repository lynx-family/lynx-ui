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

function getEffectivePropType(prop: unknown): string {
  const p = prop as { name?: unknown, type?: unknown } | null
  if (!p) return ''
  const typeText = typeof (p as any)?.type === 'string' ? (p as any).type : ''
  const fallbackText = (p as any)?.docTypeFallback?.content?.[0]?.text
  return (
    typeof fallbackText === 'string' && fallbackText.length > 0
      ? fallbackText
      : typeText
  )
}

interface RenderFunctionParameter {
  inlineProperties?: string
  typeName?: string
}

function getRenderFunctionParameter(
  prop: unknown,
): RenderFunctionParameter | null {
  const p = prop as { name?: unknown } | null
  if (!p || p.name !== 'children') return null

  const effectiveType = getEffectivePropType(prop)
  if (effectiveType.length === 0 || !/=>\s*ReactNode/.test(effectiveType)) {
    return null
  }

  const inline = /\(\s*(?:status|state)\s*:\s*\{([^}]*)\}\)\s*=>/.exec(
    effectiveType,
  )
  if (inline) return { inlineProperties: inline[1] }

  const reference = /\(\s*(?:status|state)\s*:\s*([\w$.]+)\s*\)\s*=>/.exec(
    effectiveType,
  )
  if (reference) return { typeName: reference[1] }

  return null
}

function isRenderFunctionChildrenProp(prop: unknown): boolean {
  return getRenderFunctionParameter(prop) !== null
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
): Array<Record<string, unknown>> {
  const parameter = getRenderFunctionParameter(prop)
  if (!parameter) return []

  if (parameter.inlineProperties) {
    const keys = parameter.inlineProperties
      .split(/[;,]/)
      .map(item => item.trim())
      .filter(Boolean)
      .map(item => item.split(':')[0])
      .map(namePart => namePart?.replace(/\?/g, '').trim())
      .filter(Boolean)

    const descriptionsEn = getStatusDescriptionsForKeys(keys, false)
    const descriptionsZh = getStatusDescriptionsForKeys(keys, true)

    const mapped = (parameter.inlineProperties
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

  if (!parameter.typeName) return []

  const ifaceEn = findInterfaceByName(
    parameter.typeName,
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

function getApiEntityPropertyItems(entity: any): any[] {
  const groups = Array.isArray(entity?.children) ? entity.children : []
  const properties = groups.find((group: any) => group?.title === 'Properties')
  return Array.isArray(properties?.children) ? properties.children : []
}

function createApiEntityRegistry(
  entities: any[],
): ReadonlyMap<string, any> {
  const registry = new Map<string, any>()

  for (const entity of entities) {
    if (typeof entity?.title !== 'string') continue
    if (
      entity.title.endsWith('UIVariants')
      && registry.has(entity.title)
    ) {
      throw new Error(
        `Multiple UI variant declarations found for ${entity.title}.`,
      )
    }
    registry.set(entity.title, entity)
  }

  return registry
}

function getExtendedInterfaceNames(
  interfaceName: string,
  apiEntityRegistry: ReadonlyMap<string, any>,
): string[] {
  const serializedEntity = apiEntityRegistry.get(interfaceName)
  const serializedExtendedTypes = Array.isArray(
      serializedEntity?.extendedTypes,
    )
    ? serializedEntity.extendedTypes
    : []
  const names = serializedExtendedTypes
    .map((extendedType: any) => extendedType?.name)
    .filter((name: unknown): name is string => typeof name === 'string')

  const currentPackage = currentTypeDocCandidatesEn[0]
  if (!currentPackage) return names

  const node = getAllInterfaceNodes(currentPackage).find(
    candidate => candidate?.name === interfaceName,
  )
  const extendedTypes = Array.isArray(node?.extendedTypes)
    ? node.extendedTypes
    : []
  return extendedTypes
    .map((extendedType: any) => extendedType?.name)
    .filter((name: unknown): name is string => typeof name === 'string')
    .concat(names)
}

function getUiVariantEntityForPart(
  partName: string,
  apiEntityRegistry: ReadonlyMap<string, any>,
): any {
  return apiEntityRegistry.get(`${partName}UIVariants`)
}

function getRenderFunctionChildren(entity: any): unknown[] {
  const groups = Array.isArray(entity?.children) ? entity.children : []
  return groups.flatMap((group: any) => {
    const items = Array.isArray(group?.children) ? group.children : []
    return items.filter((item: unknown) => isRenderFunctionChildrenProp(item))
  })
}

function getInheritedRenderFunctionChildren(
  uiVariantsEntity: any,
  apiEntityRegistry: ReadonlyMap<string, any>,
  visited = new Set<string>(),
): unknown[] {
  if (typeof uiVariantsEntity?.title !== 'string') return []
  if (visited.has(uiVariantsEntity.title)) return []
  visited.add(uiVariantsEntity.title)

  const sources = getExtendedInterfaceNames(
    uiVariantsEntity.title,
    apiEntityRegistry,
  ).flatMap((baseTitle) => {
    if (!baseTitle.endsWith('UIVariants')) return []

    const basePartName = baseTitle.slice(0, -'UIVariants'.length)
    const propsEntity = apiEntityRegistry.get(`${basePartName}Props`)
    const renderChildren = getRenderFunctionChildren(propsEntity)
    if (renderChildren.length > 0) return [renderChildren]

    const baseUiVariantsEntity = apiEntityRegistry.get(baseTitle)
    const inherited = getInheritedRenderFunctionChildren(
      baseUiVariantsEntity,
      apiEntityRegistry,
      visited,
    )
    return inherited.length > 0 ? [inherited] : []
  })

  if (sources.length > 1) {
    throw new Error(
      `Multiple render-state sources found for ${uiVariantsEntity.title}.`,
    )
  }
  return sources[0] ?? []
}

function extractUiVariantTableSource(
  uiVariantsEntity: any,
): Array<Record<string, unknown>> {
  return getApiEntityPropertyItems(uiVariantsEntity).flatMap(
    (uiVariant: Record<string, unknown>) => {
      if (typeof uiVariant?.name !== 'string') return []

      const description = stringifyCommentContent(
        uiVariant.summary as Array<{ text?: string }> | undefined,
      )
      const descriptionZh = stringifyCommentContent(
        uiVariant.summary_zh as Array<{ text?: string }> | undefined,
      )

      return [{
        className: uiVariant.name,
        item: {
          type: typeof uiVariant.type === 'string'
            ? uiVariant.type
            : formatTypeFromTypedocType(uiVariant.type),
          description,
          description_zh: descriptionZh || description,
        },
      }]
    },
  )
}

function mergeRenderPropsAndUiVariants(
  renderPropItems: Array<Record<string, unknown>>,
  uiVariantsEntity?: any,
): Array<Record<string, unknown>> {
  if (!uiVariantsEntity) {
    const uiKeys = renderPropItems
      .map(item => item?.className)
      .filter((className: unknown): className is string =>
        typeof className === 'string'
      )
    const descriptionsEn = getUiVariantDescriptionsForKeys(uiKeys, false)
    const descriptionsZh = getUiVariantDescriptionsForKeys(uiKeys, true)

    return renderPropItems.map(item => {
      const className = typeof item?.className === 'string'
        ? item.className
        : ''
      const renderPropKey = typeof item?.['Render Prop'] === 'string'
        ? item['Render Prop']
        : null
      const renderPropType = (item as any)?.item?.type
      const uiDescEn = descriptionsEn[className]
        ?? (renderPropKey
          ? getDefaultUiVariantDescription(renderPropKey, renderPropType)
          : undefined)
      const uiDescZh = descriptionsZh[className]
      const baseDescEn = (item as any)?.item?.description as string | undefined
      const baseDescZh = (item as any)?.item?.description_zh as
        | string
        | undefined

      return {
        ...item,
        item: {
          ...(item as any).item,
          description: uiDescEn
            ? `${baseDescEn ?? ''}\n${uiDescEn}`.trim()
            : baseDescEn,
          description_zh: uiDescZh
            ? `${baseDescZh ?? ''}\n${uiDescZh}`.trim()
            : baseDescZh,
        },
      }
    })
  }

  const uiVariantsByClassName = new Map(
    getApiEntityPropertyItems(uiVariantsEntity).flatMap(
      (uiVariant: Record<string, unknown>) => {
        const className = uiVariant?.name
        return typeof className === 'string' ? [[className, uiVariant]] : []
      },
    ),
  )

  const renderPropsByClassName = new Map(
    renderPropItems.flatMap((item: Record<string, unknown>) => {
      const className = item?.className
      return typeof className === 'string' ? [[className, item]] : []
    }),
  )
  for (const className of uiVariantsByClassName.keys()) {
    if (!renderPropsByClassName.has(className)) {
      throw new Error(
        `${uiVariantsEntity.title}.${className} has no matching render state.`,
      )
    }
  }

  return renderPropItems.flatMap((item: Record<string, unknown>) => {
    const className = typeof item?.className === 'string' ? item.className : ''
    const uiVariant = uiVariantsByClassName.get(className)
    if (!uiVariant) return []

    const renderPropKey = typeof item?.['Render Prop'] === 'string'
      ? item['Render Prop']
      : null
    const renderPropType = (item as any)?.item?.type

    const uiDescEn = stringifyCommentContent(
      uiVariant?.summary as Array<{ text?: string }> | undefined,
    ) || (
      renderPropKey
        ? getDefaultUiVariantDescription(renderPropKey, renderPropType)
        : undefined
    )
    const uiDescZh = stringifyCommentContent(
      uiVariant?.summary_zh as Array<{ text?: string }> | undefined,
    ) || undefined

    const baseDescEn = (item as any)?.item?.description as string | undefined
    const baseDescZh = (item as any)?.item?.description_zh as
      | string
      | undefined

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
 * Formats a generated API heading with an explicit namespace. Nested group
 * anchors include their owning entity so repeated Properties and Events
 * headings remain unique after downstream MDX fragments are composed.
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
  sourceTitle: string,
  apiEntityRegistry: ReadonlyMap<string, any>,
  isZh?: boolean,
) {
  const title = data.title
  const children = data.children
  const comments = getCommentText(data.comment, isZh)
  const partName = sourceTitle.replace(/Props$/, '')
  const uiVariantsEntity = getUiVariantEntityForPart(
    partName,
    apiEntityRegistry,
  )

  if (!children?.length) return ''

  const sections = [
    formatApiHeading('###', title),
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
    sections.push(
      children.length > 1
        ? formatApiHeading('####', d.title, title)
        : '',
      `<UIApiTable source={${sourceString}}/>`,
    )

    if (renderChildren.length > 0) {
      const renderSourceString = JSON.stringify(renderChildren, null, 2)

      // Inject a single-tag reference to <ClassRenderPropPreamble />. The actual
      // component (which picks the current locale via Rspress's `useLang()` hook
      // and renders the corresponding copy) is defined once at the top of every
      // generated APIReference.mdx that contains at least one ClassRenderPropTable.
      const classRenderPropPreamble = `<ClassRenderPropPreamble />`

      sections.push(
        `<UIApiTable source={${renderSourceString}}/>`,
        classRenderPropPreamble,
        ...renderChildren.map((item: unknown) => {
          const renderPropItems = extractRenderFunctionTableSource(item)
          const tableSource = mergeRenderPropsAndUiVariants(
            renderPropItems,
            uiVariantsEntity,
          )
          return `<ClassRenderPropTable source={${
            JSON.stringify(tableSource, null, 2)
          }}/>`
        }),
      )
    }
  })

  const ownRenderChildren = getRenderFunctionChildren(data)
  if (ownRenderChildren.length === 0 && uiVariantsEntity) {
    const inheritedRenderChildren = getInheritedRenderFunctionChildren(
      uiVariantsEntity,
      apiEntityRegistry,
    )
    if (inheritedRenderChildren.length > 0) {
      sections.push(
        getCommentText(uiVariantsEntity.comment, isZh),
        ...inheritedRenderChildren.map((item: unknown) => {
          const tableSource = mergeRenderPropsAndUiVariants(
            extractRenderFunctionTableSource(item),
            uiVariantsEntity,
          )
          return `<ClassRenderPropTable source={${
            JSON.stringify(tableSource, null, 2)
          }}/>`
        }),
      )
    } else {
      const tableSource = extractUiVariantTableSource(uiVariantsEntity)
      sections.push(
        getCommentText(uiVariantsEntity.comment, isZh),
        `<ClassRenderPropTable source={${
          JSON.stringify(tableSource, null, 2)
        }}/>`,
      )
    }
  }

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
function genTypeAlias(data: any) {
  if (!data.typeAlias) return ''

  const sourceString = JSON.stringify([data.typeAlias], null, 2)
  return joinMdxSections([
    formatApiHeading('###', data.title),
    `<UIApiTable source={${sourceString}}/>`,
  ])
}

/**
 * Recursively converts generic TypeDoc groups into headings and API tables.
 */
const doGenMdx = (data: any, isZh?: boolean) => {
  if (!data?.[0]?.flag && !data?.[0]?.children) {
    if (!data) {
      return ''
    }

    const sourceString = JSON.stringify(data, null, 2)
    return `<UIApiTable source={${sourceString}}/>`
  }

  return joinMdxSections(
    data.map((d: any) => {
      if (d.flag && d.title) {
        const comments = getCommentText(d.comment, isZh)
        return d.flag === '###'
          ? joinMdxSections([
            formatApiHeading('###', d.title),
            comments,
            doGenMdx(d.children, isZh),
          ])
          : doGenMdx(d.children, isZh)
      }
    }),
  )
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
  multipleProps?: boolean,
  titleOrder: string[] = ['Props', 'Method'],
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

  const apiEntityRegistry = createApiEntityRegistry(data.children)
  const sortedData = data.children.sort((a: any, b: any) => {
    if (a.title.includes('Ref')) return 1
    if (b.title.includes('Ref')) return -1

    const getOrderIndex = (name: string) => {
      const normalizedName = name.replace(/(?:Props|Ref)$/, '')
      const exactIndex = titleOrder.indexOf(normalizedName)
      if (exactIndex !== -1) return exactIndex

      const index = titleOrder.findIndex(item => name.includes(item))
      return index === -1 ? titleOrder.length : index
    }
    return getOrderIndex(a.title) - getOrderIndex(b.title)
  })

  let hasProcessedFirstProps = false

  // If a component consumes render-props via `children`, hide the corresponding
  // standalone `*RenderProps` interface section to match Dialog-style docs.
  const renderPropsTitlesToSkip = new Set<string>()
  if (Array.isArray(sortedData)) {
    const extractInlineRenderPropKeys = (
      parameter: RenderFunctionParameter,
    ): string[] => {
      if (!parameter.inlineProperties) return []
      return parameter.inlineProperties
        .split(';')
        .map((s: string) => s.trim())
        .filter(Boolean)
        .map((s: string) => s.split(':')[0]?.replace(/\?/g, '').trim())
        .filter(Boolean)
    }

    for (const item of sortedData) {
      if (typeof item?.title !== 'string') continue
      if (!item.title.endsWith('Props')) continue
      const props = getApiEntityPropertyItems(item)
      const childrenProp = props.find((p: any) => p?.name === 'children')
      const parameter = getRenderFunctionParameter(childrenProp)
      if (!parameter) continue

      if (parameter.typeName) {
        renderPropsTitlesToSkip.add(parameter.typeName)
        continue
      }

      const keys = extractInlineRenderPropKeys(parameter)
      if (keys.length === 0) continue

      const partName = item.title.replace(/Props$/, '')
      const candidateTitle = `${partName}RenderProps`
      const candidate = apiEntityRegistry.get(candidateTitle)
      const candidateKeys = new Set(
        getApiEntityPropertyItems(candidate)
          .map((property: any) => property?.name)
          .filter((name: unknown): name is string => typeof name === 'string'),
      )
      if (keys.every(key => candidateKeys.has(key))) {
        renderPropsTitlesToSkip.add(candidateTitle)
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

  // Keep top-level fragments unjoined until every optional entity is filtered.
  const generatedSections = multipleProps
    ? sortedData.map((item: any) => {
      if (renderPropsTitlesToSkip.has(item.title)) return ''
      if (item.title.endsWith('UIVariants')) return ''
      if (!titleOrder.includes(item.title.replace(/(?:Props|Ref)$/, ''))) {
        return
      }
      const displayItem = withApiEntityDisplayTitle(
        item,
        publicRuntimeExportNames,
      )
      if (item.title.includes('Ref')) {
        return genRef(displayItem, isZh)
      }
      if (item.typeAlias) {
        return genTypeAlias(displayItem)
      }
      if (
        item.title.includes('Props')
        || item.children?.length
      ) {
        return genProps(
          displayItem,
          item.title,
          apiEntityRegistry,
          isZh,
        )
      }
      return
    })
    : sortedData.map((item: any) => {
      if (renderPropsTitlesToSkip.has(item.title)) return ''
      if (item.title.endsWith('UIVariants')) return ''
      const displayItem = withApiEntityDisplayTitle(
        item,
        publicRuntimeExportNames,
      )
      if (item.title.includes('Props')) {
        if (!hasProcessedFirstProps) {
          hasProcessedFirstProps = true
          return genProps(
            displayItem,
            item.title,
            apiEntityRegistry,
            isZh,
          )
        }
        return doGenMdx([displayItem], isZh)
      }
      if (item.title.includes('Ref')) {
        return genRef(displayItem, isZh)
      }
      if (item.typeAlias) {
        return genTypeAlias(displayItem)
      }
      return doGenMdx([displayItem], isZh)
    })

  const generatedBody = joinMdxSections(generatedSections)
  let content = joinMdxSections([
    mdxHeader,
    generatedBody ? '## API Reference {#api}' : '',
    generatedBody,
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
