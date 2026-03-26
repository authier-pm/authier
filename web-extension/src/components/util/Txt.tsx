import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '@src/lib/cn'

type TxtProps = HTMLAttributes<HTMLParagraphElement> & {
  bg?: string
  bottom?: number | string
  color?: string
  fontSize?: string
  fontWeight?: string
  left?: number | string
  mb?: number | string
  mr?: number | string
  mt?: number | string
  noOfLines?: number
  position?: CSSProperties['position']
  px?: number | string
  py?: number | string
  rounded?: string
  textTransform?: CSSProperties['textTransform']
  top?: number | string
  whiteSpace?: CSSProperties['whiteSpace']
}

const spacingValue = (value?: number | string) => {
  if (value === undefined) {
    return undefined
  }

  if (typeof value === 'number') {
    return `${value * 4}px`
  }

  return value
}

const fontSizeMap: Record<string, string> = {
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '5xl': '3rem'
}

const colorMap: Record<string, string> = {
  'gray.100': '#f0f4f4',
  'gray.500': 'var(--color-muted)',
  'gray.600': 'var(--color-muted)',
  'blue.800': '#005766',
  'cyan.800': '#005766',
  'red.300': '#FC045A',
  'red.700': '#8b2c2c',
  'yellow.600': 'var(--color-warning)'
}

const radiusMap: Record<string, string> = {
  md: 'var(--radius-md)',
  xl: '1rem'
}

export const Txt = ({
  bg,
  bottom,
  className,
  color,
  fontSize,
  fontWeight,
  left,
  mb,
  mr,
  mt,
  noOfLines,
  position,
  px,
  py,
  rounded,
  style,
  textTransform,
  top,
  whiteSpace,
  ...props
}: TxtProps) => {
  return (
    <p
      className={cn('text-[color:var(--color-foreground)]', className)}
      style={{
        background: bg ? colorMap[bg] ?? bg : undefined,
        bottom: spacingValue(bottom),
        color: color ? colorMap[color] ?? color : undefined,
        fontSize: fontSize ? fontSizeMap[fontSize] ?? fontSize : undefined,
        fontWeight,
        left: spacingValue(left),
        marginBottom: spacingValue(mb),
        marginRight: spacingValue(mr),
        marginTop: spacingValue(mt),
        overflow: noOfLines ? 'hidden' : undefined,
        paddingInline: spacingValue(px),
        paddingBlock: spacingValue(py),
        position,
        borderRadius: rounded ? radiusMap[rounded] ?? rounded : undefined,
        textOverflow: noOfLines ? 'ellipsis' : undefined,
        textTransform,
        top: spacingValue(top),
        whiteSpace: noOfLines ? 'nowrap' : whiteSpace,
        ...style
      }}
      {...props}
    />
  )
}

export const TxtNowrap = (props: TxtProps) => {
  return <Txt {...props} whiteSpace="nowrap" />
}
