// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { JSONOutput, ReflectionKind } from 'typedoc'

function isDeclaration(
  reflection?: JSONOutput.Reflection,
): reflection is JSONOutput.DeclarationReflection {
  return reflection != null
    && (
      reflection.kind === ReflectionKind.Interface
      || reflection.kind === ReflectionKind.TypeAlias
    )
}

/**
 * Expands polymorphic unions whose members use `as` as their discriminator.
 * @param json The serialized TypeDoc project.
 */
export function expandPolymorphicUnions(
  json: JSONOutput.ProjectReflection,
): void {
  const idMap = new Map<
    JSONOutput.ReflectionId,
    JSONOutput.DeclarationReflection
  >()
  const nameMap = new Map<string, JSONOutput.DeclarationReflection>()
  json.children?.forEach(child => {
    if (isDeclaration(child)) {
      idMap.set(child.id, child)
      nameMap.set(child.name, child)
    }
  })

  const memberIdsToRemove = new Set<JSONOutput.ReflectionId>()
  const expandedUnions = new Map<
    JSONOutput.ReflectionId,
    JSONOutput.DeclarationReflection
  >()

  for (const unionProps of json.children ?? []) {
    if (
      !isDeclaration(unionProps)
      || unionProps.kind !== ReflectionKind.TypeAlias
      || unionProps.type?.type !== 'union'
    ) {
      continue
    }

    const memberDeclarations = unionProps.type.types.map(member => {
      if (member.type !== 'reference') return undefined
      if (typeof member.target === 'number') {
        return idMap.get(member.target)
      }
      if (member.name) return nameMap.get(member.name)
      return undefined
    })
    if (
      memberDeclarations.some(member => member == null)
      || !memberDeclarations.every(member =>
        member?.children?.some(
          child =>
            child.kind === ReflectionKind.Property && child.name === 'as',
        )
      )
    ) {
      continue
    }

    const resolvedMemberDeclarations = memberDeclarations.filter(
      (member): member is JSONOutput.DeclarationReflection => member != null,
    )
    const mergedInterface = {
      ...unionProps,
      kind: ReflectionKind.Interface,
      type: undefined,
      children: [],
      groups: [{ title: 'Properties', children: [] }],
    } as JSONOutput.DeclarationReflection

    const propertiesByName = new Map<
      string,
      JSONOutput.DeclarationReflection
    >()

    for (const memberDeclaration of resolvedMemberDeclarations) {
      memberIdsToRemove.add(memberDeclaration.id)
      for (const property of memberDeclaration.children ?? []) {
        if (property.kind !== ReflectionKind.Property) continue

        const existingProperty = propertiesByName.get(property.name)
        if (existingProperty) {
          if (
            property.name === 'as'
            && existingProperty.type
            && property.type
          ) {
            const existingTypes = existingProperty.type.type === 'union'
              ? existingProperty.type.types
              : [existingProperty.type]
            const newTypes = property.type.type === 'union'
              ? property.type.types
              : [property.type]

            const seenLiterals = new Set()
            const uniqueTypes = [...existingTypes, ...newTypes].filter(type => {
              if (type.type === 'literal') {
                if (seenLiterals.has(type.value)) return false
                seenLiterals.add(type.value)
              }
              return true
            })

            existingProperty.type = { type: 'union', types: uniqueTypes }
          }
        } else {
          propertiesByName.set(property.name, property)
        }
      }
    }

    const finalProperties = Array.from(propertiesByName.values())
    mergedInterface.children = finalProperties
    if (mergedInterface.groups?.[0]) {
      mergedInterface.groups[0].children = finalProperties.map(
        property => property.id,
      )
    }

    expandedUnions.set(unionProps.id, mergedInterface)
  }

  if (expandedUnions.size === 0) return

  json.children = json.children
    ?.filter(child => !memberIdsToRemove.has(child.id))
    .map(child => expandedUnions.get(child.id) ?? child)

  json.groups?.forEach(group => {
    group.children = group.children?.filter(id => !memberIdsToRemove.has(id))
  })
}
