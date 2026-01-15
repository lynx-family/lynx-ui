// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, it, expect } from 'vitest'
import { get, noop } from './common'

describe('common utils', () => {
  describe('get', () => {
    const testObj = {
      a: {
        b: {
          c: 'value',
        },
        arr: [{ nested: 'array-value' }],
      },
      nullValue: null,
      undefinedValue: undefined,
    }

    it('should return value for dot notation path', () => {
      expect(get(testObj, 'a.b.c')).toBe('value')
    })

    it('should return value for bracket notation path', () => {
      expect(get(testObj, 'a[b][c]')).toBe('value')
    })

    it('should return value for array index path', () => {
      expect(get(testObj, 'a.arr[0].nested')).toBe('array-value')
      expect(get(testObj, 'a.arr.0.nested')).toBe('array-value')
    })

    it('should return default value when path does not exist', () => {
      expect(get(testObj, 'a.b.d', 'default')).toBe('default')
      expect(get(testObj, 'x.y.z', 'default')).toBe('default')
    })

    it('should return undefined when no default value is provided and path does not exist', () => {
      expect(get(testObj, 'a.b.d')).toBeUndefined()
    })

    it('should handle null and undefined values', () => {
      expect(get(testObj, 'nullValue.something', 'default')).toBe('default')
      expect(get(testObj, 'undefinedValue.something', 'default')).toBe(
        'default',
      )
    })

    it('should return default value when input is not an object', () => {
      expect(get(null, 'any.path', 'default')).toBe('default')
      expect(get(undefined, 'any.path', 'default')).toBe('default')
      expect(get('string', 'any.path', 'default')).toBe('default')
      expect(get(123, 'any.path', 'default')).toBe('default')
    })
  })

  describe('noop', () => {
    it('should be a function that returns undefined', () => {
      expect(typeof noop).toBe('function')
      expect(noop()).toBeUndefined()
    })
  })
})
