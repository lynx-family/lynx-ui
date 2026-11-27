// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createRef } from '@lynx-js/react'

import { render } from '@lynx-js/react/testing-library'
import type { NodesRef } from '@lynx-js/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  InvokeRejectError,
  getRect,
  getRectById,
  getRectByRef,
  invokeById,
  invokeByRef,
  setNativeProps,
  setNativePropsById,
  setNativePropsByRef,
} from './selector'

interface InvokeOptions {
  method: string
  params?: Record<string, unknown>
  success?: (res: unknown) => void
  fail?: (res: { code: number, data?: unknown }) => void
}

const invokeMock = vi.fn((_options: InvokeOptions) => ({ exec: vi.fn() }))

beforeEach(() => {
  invokeMock.mockReset()
  const prototype = Object.getPrototypeOf(
    lynx.createSelectorQuery().selectUniqueID(0),
  ) as { invoke: (options: InvokeOptions) => { exec: () => void } }
  vi.spyOn(prototype, 'invoke').mockImplementation(invokeMock)
})

describe('selector utils', () => {
  describe('InvokeRejectError', () => {
    it('should create error with code and message', () => {
      const error = new InvokeRejectError(404, 'Not Found')
      expect(error.errorCode).toBe(404)
      expect(error.message).toBe('Not Found')
    })
  })

  describe('setNativeProps functions', () => {
    const testProps = { 'test-prop': 'active' }

    describe('setNativePropsByRef', () => {
      it('should call setNativeProps with ref', () => {
        const ref = createRef<NodesRef>()
        const { container } = render(<view id='test-id' ref={ref} />)
        setNativePropsByRef(ref, testProps)
        expect(container.querySelector('#test-id')?.getAttribute('test-prop'))
          .toBe('active')
      })
    })

    describe('setNativePropsById', () => {
      it('should call setNativeProps with id', () => {
        const { container } = render(<view id='test-id' />)
        setNativePropsById('test-id', testProps)
        expect(container.querySelector('#test-id')?.getAttribute('test-prop'))
          .toBe('active')
      })
    })

    describe('setNativeProps', () => {
      it('should use id when available', () => {
        const { container } = render(<view id='test-id' />)
        setNativeProps({ id: 'test-id' }, testProps)
        expect(container.querySelector('#test-id')?.getAttribute('test-prop'))
          .toBe('active')
      })

      it('should use ref when id is not available', () => {
        const ref = createRef<NodesRef>()
        const { container } = render(<view id='ref-target' ref={ref} />)
        setNativeProps({ ref }, testProps)
        expect(
          container.querySelector('#ref-target')?.getAttribute('test-prop'),
        ).toBe('active')
      })
    })
  })

  describe('invoke functions', () => {
    const method = 'testMethod'
    const params = { test: true }

    describe('invokeByRef', () => {
      it('should resolve successfully', async () => {
        const ref = createRef<NodesRef>()
        render(<view id='test-id' ref={ref} />)
        const successResponse = { data: 'success' }
        invokeMock.mockImplementation(({ success }) => ({
          exec: () => success?.(successResponse),
        }))

        const result = await invokeByRef(ref, method, params)
        expect(result).toBe(successResponse)
      })

      it('should reject when no ref current', async () => {
        const emptyRef = createRef<NodesRef>()
        await expect(invokeByRef(emptyRef, method, params)).rejects.toThrow(
          'no node found for the ref',
        )
      })

      it('should reject on failure', async () => {
        const ref = createRef<NodesRef>()
        render(<view id='test-id' ref={ref} />)
        invokeMock.mockImplementation(({ fail }) => ({
          exec: () => fail?.({ code: 500, data: 'error' }),
        }))

        await expect(invokeByRef(ref, method, params)).rejects.toThrow()
      })
    })

    describe('invokeById', () => {
      it('should resolve successfully', async () => {
        render(<view id='test-id' />)
        const successResponse = { data: 'success' }
        invokeMock.mockImplementation(({ success }) => ({
          exec: () => success?.(successResponse),
        }))

        const result = await invokeById('test-id', method, params)
        expect(result).toBe(successResponse)
      })

      it('should reject on failure', async () => {
        render(<view id='test-id' />)
        invokeMock.mockImplementation(({ fail }) => ({
          exec: () => fail?.({ code: 500, data: 'error' }),
        }))

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
        const ref = createRef<NodesRef>()
        render(<view id='test-id' ref={ref} />)
        invokeMock.mockImplementation(({ success }) => ({
          exec: () => success?.(mockRect),
        }))

        const result = await getRectByRef(ref)
        expect(result).toEqual(mockRect)
      })

      it('should get rect relative to screen', async () => {
        const ref = createRef<NodesRef>()
        render(<view id='test-id' ref={ref} />)
        invokeMock.mockImplementation(({ success, params }) => ({
          exec: () => {
            expect(params?.relativeTo).toBe('screen')
            success?.(mockRect)
          },
        }))

        const result = await getRectByRef(ref, true)
        expect(result).toEqual(mockRect)
      })
    })

    describe('getRectById', () => {
      it('should get rect by id', async () => {
        render(<view id='test-id' />)
        invokeMock.mockImplementation(({ success }) => ({
          exec: () => success?.(mockRect),
        }))

        const result = await getRectById('test-id')
        expect(result).toEqual(mockRect)
      })
    })

    describe('getRect', () => {
      it('should use id when available', async () => {
        render(<view id='test-id' />)
        invokeMock.mockImplementation(({ success }) => ({
          exec: () => success?.(mockRect),
        }))

        const result = await getRect({ id: 'test-id' })
        expect(result).toEqual(mockRect)
      })

      it('should use ref when id is not available', async () => {
        const ref = createRef<NodesRef>()
        render(<view id='test-id' ref={ref} />)
        invokeMock.mockImplementation(({ success }) => ({
          exec: () => success?.(mockRect),
        }))

        const result = await getRect({ ref })
        expect(result).toEqual(mockRect)
      })
    })
  })
})
