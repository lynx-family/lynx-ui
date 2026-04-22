// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Application, JSONOutput, ReflectionKind, Serializer } from 'typedoc'

/**
 * A type guard to check if a JSON reflection is a declaration (like an interface or type alias).
 * - 1 : Project
 * - 256 : Interface
 * - 512 : Constructor
 * - 1024 : Property
 * - 2048 : Method
 * - 4096 : Call Signature
 * - 2097152 : Type alias
 */
function isDeclaration(
  refl?: JSONOutput.Reflection,
): refl is JSONOutput.DeclarationReflection {
  return refl != null
    && (
      refl.kind === ReflectionKind.Interface
      || refl.kind === ReflectionKind.TypeAlias
    )
}

/**
 * This plugin hooks into the end of the TypeDoc serialization process.
 * It finds a union type alias and transforms it into a merged interface to simplify rendering.
 */
export function load(app: Application) {
  app.serializer.on(
    Serializer.EVENT_END,
    (event: any) => {
      const json = event.output as JSONOutput.ProjectReflection | undefined
      if (!json) return

      const idMap = new Map<number, JSONOutput.DeclarationReflection>()
      const nameMap = new Map<string, JSONOutput.DeclarationReflection>()
      json.children?.forEach(child => {
        if (child.id != null && isDeclaration(child)) {
          idMap.set(child.id, child)
          nameMap.set(child.name, child)
        }
      })

      const propsIndex = json.children?.findIndex(
        child => child.type?.type === 'union',
      )
      if (propsIndex === undefined || propsIndex === -1) return

      const unionProps = json.children?.[propsIndex]
      const unionType = unionProps?.type as JSONOutput.UnionType | undefined

      const memberDeclarations = unionType?.types
        .map(member => {
          if (member.type === 'reference') {
            if (typeof member.target === 'number') {
              return idMap.get(member.target)
            }
            if (member.name) return nameMap.get(member.name)
          }
          return undefined
        })
        .filter((decl): decl is JSONOutput.DeclarationReflection => !!decl)
      if (!memberDeclarations || memberDeclarations.length === 0) return

      const mergedInterface = {
        ...(unionProps as any),
        kind: ReflectionKind.Interface,
        type: undefined,
        children: [],
        groups: [{ title: 'Properties', children: [] }],
      } as JSONOutput.DeclarationReflection

      const propertiesByName = new Map<
        string,
        JSONOutput.DeclarationReflection
      >()
      const memberIdsToRemove = new Set<number>()

      for (const memberDecl of memberDeclarations) {
        memberIdsToRemove.add(memberDecl.id)
        if (!memberDecl.children) continue

        for (const prop of memberDecl.children) {
          if (prop.kind !== ReflectionKind.Property) continue

          const existingProp = propertiesByName.get(prop.name)
          if (existingProp) {
            if (prop.name === 'as' && existingProp.type && prop.type) {
              const existingTypes = existingProp.type.type === 'union'
                ? existingProp.type.types
                : [existingProp.type]
              const newTypes = prop.type.type === 'union'
                ? prop.type.types
                : [prop.type]

              const allTypes = [...existingTypes, ...newTypes]
              const seenLiterals = new Set()
              const uniqueTypes = allTypes.filter(t => {
                if (t.type === 'literal') {
                  if (seenLiterals.has(t.value)) return false
                  seenLiterals.add(t.value)
                }
                return true
              })

              existingProp.type = { type: 'union', types: uniqueTypes }
            }
          } else {
            propertiesByName.set(prop.name, prop)
          }
        }
      }

      const finalProps = Array.from(propertiesByName.values())
      mergedInterface.children = finalProps
      if (mergedInterface.groups?.[0]) {
        mergedInterface.groups[0].children = finalProps.map(p => p.id)
      }

      const childrenWithoutMembers = json.children?.filter(
        child => !memberIdsToRemove.has(child.id),
      ) ?? []

      const targetIndex = childrenWithoutMembers.findIndex(
        child => unionProps && child.id === unionProps.id,
      )
      if (targetIndex !== -1) {
        childrenWithoutMembers[targetIndex] = mergedInterface
        json.children = childrenWithoutMembers
      }

      if (json.groups) {
        json.groups.forEach(group => {
          group.children = group.children?.filter(id =>
            !memberIdsToRemove.has(id)
          )
        })
      }
    },
  )
}
