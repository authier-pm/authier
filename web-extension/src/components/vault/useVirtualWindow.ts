import { useEffect, useMemo, useState, type RefObject } from 'react'

type Size = {
  width: number
  height: number
}

export function useElementSize<T extends HTMLElement>(
  ref: RefObject<T | null>
): Size {
  const [size, setSize] = useState<Size>({ height: 0, width: 0 })

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return
    }

    const updateSize = () => {
      const nextSize = {
        height: element.clientHeight,
        width: element.clientWidth
      }

      setSize((currentValue) => {
        if (
          currentValue.height === nextSize.height &&
          currentValue.width === nextSize.width
        ) {
          return currentValue
        }

        return nextSize
      })
    }

    updateSize()

    const observer = new ResizeObserver(() => {
      updateSize()
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [ref])

  return size
}

export function useVirtualWindow({
  itemCount,
  itemSize,
  overscan,
  scrollOffset,
  viewportSize
}: {
  itemCount: number
  itemSize: number
  overscan: number
  scrollOffset: number
  viewportSize: number
}) {
  return useMemo(() => {
    if (itemCount === 0) {
      return {
        endIndex: -1,
        startIndex: 0,
        totalSize: 0
      }
    }

    const safeViewportSize = Math.max(viewportSize, itemSize)
    const visibleStartIndex = Math.floor(scrollOffset / itemSize)
    const visibleEndIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollOffset + safeViewportSize) / itemSize)
    )

    return {
      endIndex: Math.min(itemCount - 1, visibleEndIndex + overscan),
      startIndex: Math.max(0, visibleStartIndex - overscan),
      totalSize: itemCount * itemSize
    }
  }, [itemCount, itemSize, overscan, scrollOffset, viewportSize])
}
