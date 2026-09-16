import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BiFileBlank } from 'react-icons/bi'
import { constructURL } from '@shared/urlUtils'

export function SecretItemIcon(props: {
  iconUrl: string | null | undefined
  url?: string | null | undefined
  alt?: string
  fallback?: ReactNode
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [shouldLoadImage, setShouldLoadImage] = useState(false)
  const [didImageFail, setDidImageFail] = useState(false)

  const imageSrc = useMemo(() => {
    if (props.iconUrl) {
      return props.iconUrl
    }

    if (!props.url) {
      return null
    }

    try {
      const hostname = constructURL(props.url).hostname
      return `https://icons.duckduckgo.com/ip3/${hostname}.ico`
    } catch {
      return null
    }
  }, [props.iconUrl, props.url])

  useEffect(() => {
    if (!imageSrc || shouldLoadImage) {
      return
    }

    const currentContainer = containerRef.current

    if (!currentContainer || typeof IntersectionObserver === 'undefined') {
      setShouldLoadImage(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries.some((entry) => entry.isIntersecting)

        if (isIntersecting) {
          setShouldLoadImage(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '200px'
      }
    )

    observer.observe(currentContainer)

    return () => {
      observer.disconnect()
    }
  }, [imageSrc, shouldLoadImage])

  useEffect(() => {
    setDidImageFail(false)
    setShouldLoadImage(false)
  }, [imageSrc])

  if (!imageSrc || didImageFail) {
    return (
      <div
        className="flex size-[30px] items-center justify-center"
        ref={containerRef}
      >
        {props.fallback ?? <BiFileBlank className="size-[30px]" />}
      </div>
    )
  }

  return (
    <div
      className="flex size-[30px] items-center justify-center"
      ref={containerRef}
    >
      {shouldLoadImage ? (
        <img
          alt={props.alt ?? 'item icon'}
          className="size-[30px] rounded-sm object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => {
            setDidImageFail(true)
          }}
          src={imageSrc}
        />
      ) : (
        <span
          className="size-[24px] animate-pulse rounded-sm bg-current opacity-10"
          aria-hidden
        />
      )}
    </div>
  )
}
