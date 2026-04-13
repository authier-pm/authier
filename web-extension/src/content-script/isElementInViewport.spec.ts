import { describe, expect, it, vi } from 'vitest'
import {
  isElementInViewport,
  isElementVisibleInViewport,
  isHidden
} from './isElementInViewport'

describe('isElementInViewport', () => {
  it('returns true when element bounds are inside viewport', () => {
    const el = document.createElement('input')
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      left: 10,
      bottom: 20,
      right: 20,
      width: 10,
      height: 10,
      x: 10,
      y: 10,
      toJSON: () => ({})
    })

    expect(isElementInViewport(el)).toBe(true)
  })

  it('returns false when element is outside viewport', () => {
    const el = document.createElement('input')
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      left: 10,
      bottom: window.innerHeight + 10,
      right: 20,
      width: 10,
      height: 10,
      x: 10,
      y: 10,
      toJSON: () => ({})
    })

    expect(isElementInViewport(el)).toBe(false)
  })
})

describe('visibility helpers', () => {
  it('marks display none element as hidden', () => {
    const el = document.createElement('input')
    el.style.display = 'none'

    expect(isHidden(el)).toBe(true)
  })

  it('requires connected element with box and in viewport', () => {
    const el = document.createElement('input')
    document.body.appendChild(el)

    vi.spyOn(el, 'getClientRects').mockReturnValue([
      {
        bottom: 20,
        height: 10,
        left: 10,
        right: 20,
        top: 10,
        width: 10,
        x: 10,
        y: 10,
        toJSON: () => ({})
      }
    ] as unknown as DOMRectList)

    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      left: 10,
      bottom: 20,
      right: 20,
      width: 10,
      height: 10,
      x: 10,
      y: 10,
      toJSON: () => ({})
    })

    expect(isElementVisibleInViewport(el)).toBe(true)
  })

  it('returns false for detached element', () => {
    const el = document.createElement('input')

    expect(isElementVisibleInViewport(el)).toBe(false)
  })
})
