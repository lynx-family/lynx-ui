// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Serializer } from 'typedoc'

/**
 * A type guard to check if a JSON reflection is a declaration (like an interface or type alias).
 * - 1 : Project
- 256 : Interface
- 512 : Constructor
- 1024 : Property
- 2048 : Method
- 4096 : Call Signature
- 2097152 : Type alias
 * @param refl
 */
function isDeclaration(
  refl,
) {
  return refl != null && (refl.kind === 256 || refl.kind === 2097152)
}

/**
 * This plugin hooks into the end of the TypeDoc serialization process.
 * It directly manipulates the final JSON output object before it's written to a file.
 * It finds a specific Type Alias (`unionProps`) that is a union of interface references
 * (e.g., `type unionProps = FormFieldAsInput | FormFieldAsRadioGroup`),
 * and transforms it into a single merged Interface reflection.
 * This involves:
 * 1. Creating a new Interface reflection for `unionProps`.
 * 2. Merging all properties from the union members (`FormFieldAsInput`, etc.) into the new interface.
 * 3. Handling special cases like the `as` discriminator property to create a union of literals.
 * 4. Removing the original Type Alias and the now-merged member interfaces from the final output.
 * This "flattens" the union type into a single interface with a discriminator,
 * which is often easier for documentation tools to parse and display.
 * @param app
 */
export function load(app) {
  app.serializer.on(
    Serializer.EVENT_END,
    (output) => {
      if (!output.output) return
      const json = output.output

      // Create maps of all reflections by ID and name for easy lookup.
      const idMap = new Map()
      const nameMap = new Map()
      json.children?.forEach(child => {
        if (child.id != null && isDeclaration(child)) {
          idMap.set(child.id, child)
          nameMap.set(child.name, child)
        }
      })

      const propsIndex = json.children?.findIndex(
        child => child.type?.type === 'union',
      )

      if (propsIndex === undefined || propsIndex === -1) {
        return // Not found, nothing to do.
      }

      const unionProps = json.children?.[propsIndex]

      const unionType = unionProps?.type

      // 1. Get the referenced interface declarations from the union.
      const memberDeclarations = unionType?.types
        .map(member => {
          if (member.type === 'reference') {
            if (typeof member.target === 'number') {
              return idMap.get(member.target)
            }
            if (member.name) {
              return nameMap.get(member.name)
            }
          }
          return undefined
        })
        .filter((decl) => !!decl)
      if (!memberDeclarations || memberDeclarations.length === 0) {
        return // No references to merge.
      }

      // 2. Create a new merged interface reflection.
      const mergedInterface = {
        ...unionProps,
        kind: 256, // Kind.Interface
        type: undefined,
        children: [],
        groups: [{ title: 'Properties', children: [] }],
      }

      const propertiesByName = new Map()
      const memberIdsToRemove = new Set()

      for (const memberDecl of memberDeclarations) {
        memberIdsToRemove.add(memberDecl.id)
        if (!memberDecl.children) continue

        for (const prop of memberDecl.children) {
          // 1024: property
          if (prop.kind !== 1024) continue

          const existingProp = propertiesByName.get(prop.name)
          if (existingProp) {
            // 3. Merge properties, especially the 'as' discriminator.
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

      // 4. Replace the old type alias and remove the merged members from root.
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
