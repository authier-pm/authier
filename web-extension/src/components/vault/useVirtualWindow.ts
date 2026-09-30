import { useCallback, useMemo, useState, type UIEvent } from 'react'

type ScrollContainerState = {
  width: number
  height: number
  scrollTop: number
}

export function useScrollContainer<T extends HTMLElement>() {
  const [size, setSize] = useState<ScrollContainerState>({
    height: 0,
    width: 0,
    scrollTop: 0
  })

  // Attach when the scroll container mounts, including after an empty result.
  const ref = useCallback((element: T | null) => {
    if (!element) {
      return
    }

    element.scrollTop = 0

    const updateSize = () => {
      const nextSize = {
        height: element.clientHeight,
        width: element.clientWidth,
        scrollTop: element.scrollTop
      }

      setSize((currentValue) => {
        if (
          currentValue.height === nextSize.height &&
          currentValue.width === nextSize.width &&
          currentValue.scrollTop === nextSize.scrollTop
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
  }, [])

  const onScroll = useCallback((event: UIEvent<T>) => {
    const scrollTop = event.currentTarget.scrollTop
    setSize((currentValue) => ({ ...currentValue, scrollTop }))
  }, [])

  return { ...size, ref, onScroll }
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
