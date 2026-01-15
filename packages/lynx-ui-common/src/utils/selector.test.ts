// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  InvokeRejectError,
  setNativePropsByRef,
  setNativePropsById,
  setNativeProps,
  invokeByRef,
  invokeById,
  getRectByRef,
  getRectById,
  getRect,
} from './selector'

// Mock the global lynx object
const mockExec = vi.fn()
const mockSelect = vi.fn().mockReturnThis()
const mockSetNativeProps = vi.fn().mockReturnThis()
const mockInvoke = vi.fn().mockReturnThis()

global.lynx = {
  // @ts-expect-error expected
  createSelectorQuery: () => ({
    select: mockSelect,
    setNativeProps: mockSetNativeProps,
    invoke: mockInvoke,
    exec: mockExec,
  }),
}

describe('selector utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('InvokeRejectError', () => {
    it('should create error with code and message', () => {
      const error = new InvokeRejectError(404, 'Not Found')
      expect(error.errorCode).toBe(404)
      expect(error.message).toBe('Not Found')
    })
  })

  describe('setNativeProps functions', () => {
    const testProps = { style: { color: 'red' } }

    describe('setNativePropsByRef', () => {
      it('should call setNativeProps with ref', () => {
        const mockRef = {
          current: {
            setNativeProps: vi.fn().mockReturnThis(),
            exec: vi.fn(),
          },
        }
        // @ts-expect-error expected
        setNativePropsByRef(mockRef, testProps)
        expect(mockRef.current.setNativeProps).toHaveBeenCalledWith(testProps)
        expect(mockRef.current.exec).toHaveBeenCalled()
      })
    })

    describe('setNativePropsById', () => {
      it('should call setNativeProps with id', () => {
        setNativePropsById('test-id', testProps)
        expect(mockSelect).toHaveBeenCalledWith('#test-id')
        expect(mockSetNativeProps).toHaveBeenCalledWith(testProps)
        expect(mockExec).toHaveBeenCalled()
      })
    })

    describe('setNativeProps', () => {
      it('should use id when available', () => {
        setNativeProps({ id: 'test-id' }, testProps)
        expect(mockSelect).toHaveBeenCalledWith('#test-id')
      })

      it('should use ref when id is not available', () => {
        const mockRef = {
          current: {
            setNativeProps: vi.fn().mockReturnThis(),
            exec: vi.fn(),
          },
        }
        // @ts-expect-error expected
        setNativeProps({ ref: mockRef }, testProps)
        expect(mockRef.current.setNativeProps).toHaveBeenCalledWith(testProps)
      })
    })
  })

  describe('invoke functions', () => {
    const method = 'testMethod'
    const params = { test: true }

    describe('invokeByRef', () => {
      it('should resolve successfully', async () => {
        const successResponse = { data: 'success' }
        const mockRef = {
          current: {
            invoke: vi.fn().mockImplementation(({ success }) => ({
              exec: () => success(successResponse),
            })),
          },
        }

        // @ts-expect-error expected
        const result = await invokeByRef(mockRef, method, params)
        expect(result).toBe(successResponse)
      })

      it('should reject when no ref current', async () => {
        // @ts-expect-error expected
        await expect(invokeByRef({}, method, params)).rejects.toThrow(
          'no node found for the ref',
        )
      })

      it('should reject on failure', async () => {
        const mockRef = {
          current: {
            invoke: vi.fn().mockImplementation(({ fail }) => ({
              exec: () => fail({ code: 500, data: 'error' }),
            })),
          },
        }

        // @ts-expect-error expected
        await expect(invokeByRef(mockRef, method, params)).rejects.toThrow()
      })
    })

    describe('invokeById', () => {
      it('should resolve successfully', async () => {
        const successResponse = { data: 'success' }
        mockInvoke.mockImplementation(({ success }) => {
          success(successResponse)
          return { exec: mockExec }
        })

        const result = await invokeById('test-id', method, params)
        expect(result).toBe(successResponse)
      })

      it('should reject on failure', async () => {
        mockInvoke.mockImplementation(({ fail }) => {
          fail({ code: 500, data: 'error' })
          return { exec: mockExec }
        })

        await expect(invokeById('test-id', method, params)).rejects.toThrow()
      })
    })
  })

  describe('getRect functions', () => {
    const mockRect = {
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    }

    describe('getRectByRef', () => {
      it('should get rect relative to viewport', async () => {
        const mockRef = {
          current: {
            invoke: vi.fn().mockImplementation(({ success }) => ({
              exec: () => success(mockRect),
            })),
          },
        }

        // @ts-expect-error expected
        const result = await getRectByRef(mockRef)
        expect(result).toEqual(mockRect)
      })

      it('should get rect relative to screen', async () => {
        const mockRef = {
          current: {
            invoke: vi.fn().mockImplementation(({ success, params }) => ({
              exec: () => {
                expect(params.relativeTo).toBe('screen')
                success(mockRect)
              },
            })),
          },
        }

        // @ts-expect-error expected
        const result = await getRectByRef(mockRef, true)
        expect(result).toEqual(mockRect)
      })
    })

    describe('getRectById', () => {
      it('should get rect by id', async () => {
        mockInvoke.mockImplementation(({ success }) => {
          success(mockRect)
          return { exec: mockExec }
        })

        const result = await getRectById('test-id')
        expect(result).toEqual(mockRect)
      })
    })

    describe('getRect', () => {
      it('should use id when available', async () => {
        mockInvoke.mockImplementation(({ success }) => {
          success(mockRect)
          return { exec: mockExec }
        })

        const result = await getRect({ id: 'test-id' })
        expect(result).toEqual(mockRect)
      })

      it('should use ref when id is not available', async () => {
        const mockRef = {
          current: {
            invoke: vi.fn().mockImplementation(({ success }) => ({
              exec: () => success(mockRect),
            })),
          },
        }

        // @ts-expect-error expected
        const result = await getRect({ ref: mockRef })
        expect(result).toEqual(mockRect)
      })
    })
  })
})
