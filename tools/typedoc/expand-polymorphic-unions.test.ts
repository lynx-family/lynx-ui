// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { JSONOutput, ReflectionKind } from 'typedoc'
import { describe, expect, it } from 'vitest'

import { expandPolymorphicUnions } from './expand-polymorphic-unions'

function property(
  id: number,
  name: string,
  value: string,
): JSONOutput.DeclarationReflection {
  return {
    id: id as JSONOutput.ReflectionId,
    variant: 'declaration',
    name,
    kind: ReflectionKind.Property,
    flags: {},
    type: { type: 'literal', value },
  }
}

function interfaceReflection(
  id: number,
  name: string,
  discriminator: 'as' | 'type',
  value: string,
): JSONOutput.DeclarationReflection {
  const child = property(id + 100, discriminator, value)
  return {
    id: id as JSONOutput.ReflectionId,
    variant: 'declaration',
    name,
    kind: ReflectionKind.Interface,
    flags: {},
    children: [child],
    groups: [{ title: 'Properties', children: [child.id] }],
  }
}

function unionReflection(
  id: number,
  name: string,
  members: JSONOutput.DeclarationReflection[],
): JSONOutput.DeclarationReflection {
  return {
    id: id as JSONOutput.ReflectionId,
    variant: 'declaration',
    name,
    kind: ReflectionKind.TypeAlias,
    flags: {},
    type: {
      type: 'union',
      types: members.map(member => ({
        type: 'reference',
        name: member.name,
        target: member.id,
      })),
    },
  }
}

describe('expandPolymorphicUnions', () => {
  it('preserves discriminated unions while expanding later as unions', () => {
    const spring = interfaceReflection(1, 'Spring', 'type', 'spring')
    const tween = interfaceReflection(2, 'Tween', 'type', 'tween')
    const animation = unionReflection(3, 'Animation', [spring, tween])
    const input = interfaceReflection(4, 'InputField', 'as', 'Input')
    const checkbox = interfaceReflection(5, 'CheckboxField', 'as', 'Checkbox')
    const field = unionReflection(6, 'FieldProps', [input, checkbox])
    const project = {
      id: 0,
      name: 'typedoc-fixture',
      kind: ReflectionKind.Project,
      kindString: 'Project',
      flags: {},
      children: [spring, tween, animation, input, checkbox, field],
      groups: [{
        title: 'Declarations',
        children: [1, 2, 3, 4, 5, 6],
      }],
    } as unknown as JSONOutput.ProjectReflection

    expandPolymorphicUnions(project)

    expect(project.children?.map(child => child.name)).toEqual([
      'Spring',
      'Tween',
      'Animation',
      'FieldProps',
    ])
    expect(project.children?.find(child => child.name === 'Animation'))
      .toMatchObject({
        kind: ReflectionKind.TypeAlias,
        type: { type: 'union' },
      })
    expect(project.children?.find(child => child.name === 'FieldProps'))
      .toMatchObject({
        kind: ReflectionKind.Interface,
        children: [{
          name: 'as',
          type: {
            type: 'union',
            types: [
              { type: 'literal', value: 'Input' },
              { type: 'literal', value: 'Checkbox' },
            ],
          },
        }],
      })
    expect(project.groups?.[0]?.children).toEqual([1, 2, 3, 6])
  })
})
