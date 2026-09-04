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
        /(?:RenderProps|AnimationStatus|Status|UiVariants)$/i.test(nodeName)
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

    const uiDescEn = classNameStr.length > 0
      ? (uiVariantDescriptionsEn[classNameStr]
        ?? (renderPropKey
          ? `Applied when \`status.${renderPropKey}\` is true.`
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

function genProps(data: any, hasMultipleProps?: boolean, isZh?: boolean) {
  const title = data.title
  const children = data.children
  const comments = getCommentText(data.comment, isZh)

  let context = ''

  if (!children?.length) return ''

  context = `
${
    hasMultipleProps
      ? `### ${title.replace(/props$/i, '').trim()}`
      : `## ${title}`
  }

${comments ?? ''}
  `
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
    if (children.length > 1) {
      context += `
### ${d.title}
<UIApiTable source={${sourceString}}/>
      `
    } else {
      context += `
<UIApiTable source={${sourceString}}/>
      `
    }

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

      context += `
<UIApiTable source={${renderSourceString}}/>
${classRenderPropPreamble}
<ClassRenderPropTable source={${mergedTableSource}}/>
      `
    }
  })
  return context
}

function genRef(data: any, isZh?: boolean) {
  const title = data.title
  const children = data.children
  const comments = getCommentText(data.comment, isZh)

  if (!children?.length) return ''

  return children.map((d: any, index: number) => {
    const sourceString = JSON.stringify(d.children, null, 2)
    return `
## ${title}

${index === 0 ? comments ?? '' : ''}

<UIApiTable source={${sourceString}}/>
  `
  }).join('\n')
}

function genTypeAlias(data: any) {
  if (!data.typeAlias) return ''

  const sourceString = JSON.stringify([data.typeAlias], null, 2)
  return `
### ${data.title}

<UIApiTable source={${sourceString}}/>
  `
}

const doGenMdx = (data: any, isZh?: boolean) => {
  if (!data?.[0]?.flag && !data?.[0]?.children) {
    if (!data) {
      return ''
    }

    const sourceString = JSON.stringify(data, null, 2)
    return `
<UIApiTable source={${sourceString}}/>
    `
  }

  return data
    .map((d: any) => {
      if (d.flag && d.title) {
        const comments = getCommentText(d.comment, isZh)
        return d.flag === '###'
          ? `
${d.flag} ${d.title}
${comments ?? ''}
${doGenMdx(d.children, isZh)}
      `
          : `${doGenMdx(d.children, isZh)}`
      }
    })
    .join('\n')
}

const doGenTplWithData = async (
  dataPath: string,
  savePath: string,
  multipleProps?: boolean,
  titleOrder: string[] = ['Props', 'Method'],
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
  let content

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
  // by the `@lynx-ui/index` entry, not this repository) that is rendered
  // above every <ClassRenderPropTable/> in the body. We always import it
  // eagerly here and strip it from the import statement at the end if the
  // generated body does not actually use it, so components without any
  // render-prop table don't ship an unused import.
  const mdxHeader =
    `import { UIApiTable, ClassRenderPropTable, ClassRenderPropPreamble } from "@lynx-ui/index";
`

  if (multipleProps) {
    content = `${mdxHeader}
  ${
      sortedData.map((item: any) => {
        if (renderPropsTitlesToSkip.has(item.title)) return ''
        if (!titleOrder.includes(item.title.replace(/(?:Props|Ref)$/, ''))) {
          return
        }
        if (item.title.includes('Ref')) {
          return genRef(item, isZh)
        }
        if (item.typeAlias) {
          return genTypeAlias(item)
        }
        if (
          item.title.includes('Props')
          || item.title.endsWith('UIVariants')
          || item.children?.length
        ) {
          return genProps(item, multipleProps, isZh)
        }
        return
      }).join('\n')
    }
  `
  } else {
    content = `${mdxHeader}

  ${
      sortedData.map((item: any) => {
        if (renderPropsTitlesToSkip.has(item.title)) return ''
        if (item.title.includes('Props')) {
          if (!hasProcessedFirstProps) {
            hasProcessedFirstProps = true
            return genProps(item, false, isZh)
          }
          return doGenMdx([item], isZh)
        }
        if (item.title.includes('Ref')) {
          return genRef(item, isZh)
        }
        if (item.typeAlias) {
          return genTypeAlias(item)
        }
        return doGenMdx([item], isZh)
      }).join('\n')
    }
  `
  }

  // Drop `ClassRenderPropPreamble` from the import statement when the body
  // does not reference it, so components without any render-prop state do
  // not pull in an unused symbol.
  if (!content.includes('<ClassRenderPropPreamble />')) {
    content = content.replace(
      'import { UIApiTable, ClassRenderPropTable, ClassRenderPropPreamble } from "@lynx-ui/index";',
      'import { UIApiTable, ClassRenderPropTable } from "@lynx-ui/index";',
    )
  }

  const normalizedContent = content.replace(/[ \t]+$/gm, '').trimEnd()
  fs.writeFileSync(savePath, `${normalizedContent}\n`)
}

export { doGenTplWithData }
