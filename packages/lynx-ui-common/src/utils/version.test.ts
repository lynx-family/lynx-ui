// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  lynxSDKVersionStringToNumber,
  nativeLynxSDKVersionGreaterThan,
  nativeLynxSDKVersionLessThan,
} from './version'

function createMockSystemInfo(lynxSdkVersion: string): typeof SystemInfo {
  return {
    lynxSdkVersion,
    osVersion: '1.0',
    pixelHeight: 100,
    pixelWidth: 100,
    pixelRatio: 1,
    platform: 'Android',
    runtimeType: 'quickjs',
  }
}

describe('version utils', () => {
  describe('lynxSDKVersionStringToNumber', () => {
    it('should convert version string to number correctly', () => {
      expect(lynxSDKVersionStringToNumber('1.2.3')).toBe(10203)
      expect(lynxSDKVersionStringToNumber('2.0.0')).toBe(20000)
      expect(lynxSDKVersionStringToNumber('0.1.0')).toBe(100)
    })

    it('should handle missing version parts', () => {
      expect(lynxSDKVersionStringToNumber('1')).toBe(10000)
      expect(lynxSDKVersionStringToNumber('1.2')).toBe(10200)
      expect(lynxSDKVersionStringToNumber('')).toBe(0)
    })

    it('should handle version strings with leading zeros', () => {
      expect(lynxSDKVersionStringToNumber('01.02.03')).toBe(10203)
    })

    it('should handle large version numbers', () => {
      expect(lynxSDKVersionStringToNumber('99.99.99')).toBe(999999)
    })
  })

  describe('nativeLynxSDKVersionGreaterThan', () => {
    beforeEach(() => {
      global.SystemInfo = createMockSystemInfo('1.2.3')
    })

    it('should return true when native version is greater', () => {
      global.SystemInfo = createMockSystemInfo('1.2.4')
      expect(nativeLynxSDKVersionGreaterThan('1.2.3')).toBe(true)
    })

    it('should return false when native version is equal', () => {
      global.SystemInfo = createMockSystemInfo('1.2.3')
      expect(nativeLynxSDKVersionGreaterThan('1.2.3')).toBe(false)
    })

    it('should return false when native version is less', () => {
      global.SystemInfo = createMockSystemInfo('1.2.2')
      expect(nativeLynxSDKVersionGreaterThan('1.2.3')).toBe(false)
    })
  })

  describe('nativeLynxSDKVersionLessThan', () => {
    beforeEach(() => {
      global.SystemInfo = createMockSystemInfo('1.2.3')
    })

    it('should return true when native version is less', () => {
      global.SystemInfo = createMockSystemInfo('1.2.2')
      expect(nativeLynxSDKVersionLessThan('1.2.3')).toBe(true)
    })

    it('should return false when native version is equal', () => {
      global.SystemInfo = createMockSystemInfo('1.2.3')
      expect(nativeLynxSDKVersionLessThan('1.2.3')).toBe(false)
    })

    it('should return false when native version is greater', () => {
      global.SystemInfo = createMockSystemInfo('1.2.4')
      expect(nativeLynxSDKVersionLessThan('1.2.3')).toBe(false)
    })

    it('should handle major version differences', () => {
      global.SystemInfo = createMockSystemInfo('1.0.0')
      expect(nativeLynxSDKVersionLessThan('2.0.0')).toBe(true)
    })

    it('should handle minor version differences', () => {
      global.SystemInfo = createMockSystemInfo('1.1.0')
      expect(nativeLynxSDKVersionLessThan('1.2.0')).toBe(true)
    })
  })
})
