import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes
} from 'react'
import { cn } from '@src/lib/cn'
import { Button as UIButton } from './button'
import { Input as UIInput } from './input'
import { Tooltip as UITooltip } from './tooltip'
import { useAppToast, useThemeMode } from '@src/ExtensionProviders'

type BasicProps = HTMLAttributes<HTMLElement> & {
  [key: string]: any
  align?: string
  alignItems?: string
  as?: any
  bg?: string
  bgColor?: string
  backgroundColor?: string
  border?: string
  borderColor?: string
  borderBottom?: string
  borderBottomColor?: string
  borderBottomRadius?: string
  borderRadius?: string | number
  borderRight?: string
  borderRightColor?: string
  borderWidth?: string | number
  bottom?: string | number
  boxSize?: string | number
  boxShadow?: string
  color?: string
  cursor?: string
  direction?: string
  display?: string | Record<string, string>
  flex?: string | number
  flexDir?: string
  flexDirection?: string
  flexWrap?: string
  fontFamily?: string
  fontSize?: string | number
  fontWeight?: string | number
  gap?: string | number
  h?: string | number
  height?: string | number
  justify?: string
  justifyContent?: string
  left?: string | number
  lineHeight?: string | number
  m?: string | number | string[]
  maxH?: string | number
  maxW?: string | number
  mb?: string | number
  minH?: string | number
  minW?: string | number
  ml?: string | number
  mr?: string | number
  mt?: string | number
  mx?: string | number
  my?: string | number
  overflow?: string
  p?: string | number
  pb?: string | number
  pl?: string | number
  pos?: string
  position?: string
  pr?: string | number
  pt?: string | number
  px?: string | number | Record<string, number>
  py?: string | number
  right?: string | number
  rounded?: string
  shadow?: string
  spacing?: string | number | Record<string, string | number>
  sx?: Record<string, unknown>
  textAlign?: string
  textOverflow?: string
  top?: string | number
  transition?: string
  w?: string | number
  whiteSpace?: CSSProperties['whiteSpace']
  wordBreak?: CSSProperties['wordBreak']
  zIndex?: string | number
}

export type BoxProps = BasicProps
export type FlexProps = BasicProps

const colorMap: Record<string, string> = {
  'gray.50': '#f0f4f4',
  'gray.100': '#d6e0e0',
  'gray.200': '#bccdcd',
  'gray.300': '#a2b9b9',
  'gray.400': '#88a5a5',
  'gray.500': '#6d9292',
  'gray.600': '#577575',
  'gray.700': '#425757',
  'gray.800': '#2c3a3a',
  'gray.900': '#161d1d',
  'cyan.800': '#005766',
  'cyan.500': '#00d9ff',
  'teal.200': '#9deceb',
  'teal.400': '#50dddc',
  'teal.700': '#19807f',
  'teal.900': '#082b2a',
  'orange.100': '#ffe7b8',
  'orange.300': '#ffc85c',
  'yellow.500': '#ffa900',
  'red.400': '#c43d3d',
  'red.600': '#8b2c2c',
  'red.700': '#8b2c2c',
  'green.300': '#74e7d8',
  'green.500': '#25dac2',
  'blue.400': '#3f82ff',
  'blue.500': '#3268cc',
  'blue.800': '#005766',
  'white': '#ffffff',
  'whiteAlpha.300': 'rgba(255,255,255,0.3)',
  'whiteAlpha.100': 'rgba(255,255,255,0.1)',
  blackAlpha: 'rgba(0,0,0,0.55)'
}

const sizeValue = (value?: string | number | string[] | Record<string, unknown>) => {
  if (value === undefined || Array.isArray(value) || typeof value === 'object') {
    return undefined
  }

  return typeof value === 'number' ? `${value * 4}px` : value
}

const toStyle = (props: BasicProps): CSSProperties => ({
  alignItems: props.alignItems as CSSProperties['alignItems'],
  background:
    props.bg || props.bgColor
      ? colorMap[(props.bg || props.bgColor) as string] ?? (props.bg || props.bgColor)
      : undefined,
  border: props.border,
  borderBottom: props.borderBottom,
  borderBottomColor: props.borderBottomColor
    ? colorMap[props.borderBottomColor as string] ?? props.borderBottomColor
    : undefined,
  borderBottomLeftRadius: props.borderBottomRadius
    ? sizeValue(props.borderBottomRadius)
    : undefined,
  borderBottomRightRadius: props.borderBottomRadius
    ? sizeValue(props.borderBottomRadius)
    : undefined,
  borderColor: props.borderColor
    ? colorMap[props.borderColor as string] ?? props.borderColor
    : undefined,
  borderRadius: sizeValue(props.rounded ?? props.borderRadius),
  borderRight: props.borderRight,
  borderRightColor: props.borderRightColor
    ? colorMap[props.borderRightColor as string] ?? props.borderRightColor
    : undefined,
  borderWidth: sizeValue(props.borderWidth),
  boxShadow: props.boxShadow,
  color: props.color ? colorMap[props.color] ?? props.color : undefined,
  cursor: props.cursor,
  display: typeof props.display === 'string' ? props.display : undefined,
  flex: sizeValue(props.flex),
  flexDirection: (props.flexDir ?? props.flexDirection ?? props.direction) as CSSProperties['flexDirection'],
  flexWrap: props.flexWrap as CSSProperties['flexWrap'],
  fontFamily: props.fontFamily,
  fontSize: sizeValue(props.fontSize),
  fontWeight: props.fontWeight as CSSProperties['fontWeight'],
  gap: sizeValue(props.gap),
  height: sizeValue(props.h ?? props.height),
  justifyContent: props.justify ?? props.justifyContent,
  left: sizeValue(props.left),
  lineHeight: sizeValue(props.lineHeight),
  margin: sizeValue(props.m),
  marginBottom: sizeValue(props.mb),
  marginLeft: sizeValue(props.ml),
  marginRight: sizeValue(props.mr),
  marginTop: sizeValue(props.mt),
  maxHeight: sizeValue(props.maxH),
  maxWidth: sizeValue(props.maxW),
  minHeight: sizeValue(props.minH),
  minWidth: sizeValue(props.minW),
  overflow: props.overflow,
  padding: sizeValue(props.p),
  paddingBottom: sizeValue(props.pb),
  paddingInline: sizeValue(props.px),
  paddingLeft: sizeValue(props.pl),
  paddingRight: sizeValue(props.pr),
  paddingTop: sizeValue(props.pt),
  paddingBlock: sizeValue(props.py),
  position: (props.pos ?? props.position) as CSSProperties['position'],
  right: sizeValue(props.right),
  textAlign: props.textAlign as CSSProperties['textAlign'],
  textOverflow: props.textOverflow as CSSProperties['textOverflow'],
  top: sizeValue(props.top),
  transition: props.transition,
  whiteSpace: props.whiteSpace,
  wordBreak: props.wordBreak,
  width: sizeValue(props.w),
  zIndex: props.zIndex as CSSProperties['zIndex']
})

function createElement(tag: ElementType) {
  return forwardRef<HTMLElement, BasicProps>(function LegacyElement(
    { as, children, className, style, ...props },
    ref
  ) {
    const Component = (as ?? tag) as ElementType
    return (
      <Component
        className={className}
        ref={ref as never}
        style={{ ...toStyle(props), ...style }}
        {...props}
      >
        {children}
      </Component>
    )
  })
}

export const Box = createElement('div')
export const Flex = createElement('div')
export const Center = forwardRef<HTMLDivElement, BasicProps>(function Center(
  { style, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...toStyle(props), ...style }}
      {...props}
    />
  )
})
export const HStack = forwardRef<HTMLDivElement, BasicProps>(function HStack(
  { spacing, style, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      style={{ display: 'flex', gap: sizeValue(spacing), ...toStyle(props), ...style }}
      {...props}
    />
  )
})
export const VStack = forwardRef<HTMLDivElement, BasicProps>(function VStack(
  { spacing, style, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      style={{ display: 'flex', flexDirection: 'column', gap: sizeValue(spacing), ...toStyle(props), ...style }}
      {...props}
    />
  )
})
export const Stack = VStack

export const Text = forwardRef<HTMLParagraphElement, BasicProps & { noOfLines?: number }>(
  function Text({ noOfLines, style, ...props }, ref) {
    return (
      <p
        ref={ref}
        style={{
          overflow: noOfLines ? 'hidden' : undefined,
          textOverflow: noOfLines ? 'ellipsis' : undefined,
          whiteSpace: noOfLines ? 'nowrap' : props.whiteSpace,
          ...toStyle(props),
          ...style
        }}
        {...props}
      />
    )
  }
)

export const Heading = forwardRef<HTMLHeadingElement, BasicProps & { as?: string; size?: string }>(
  function Heading({ as = 'h2', size, style, ...props }, ref) {
    const fontSize = size === 'sm' ? '1rem' : size === 'md' ? '1.25rem' : size === 'lg' ? '1.5rem' : props.fontSize
    const Component = as as ElementType
    return (
      <Component
        ref={ref as never}
        style={{ fontSize: sizeValue(fontSize), fontWeight: 700, ...toStyle(props), ...style }}
        {...props}
      />
    )
  }
)

export const Link = forwardRef<HTMLAnchorElement, BasicProps & { as?: any; href?: string; to?: string }>(
  function Link({ as: Component = 'a', style, ...props }, ref) {
    return <Component ref={ref} style={{ textDecoration: 'none', ...toStyle(props), ...style }} {...props} />
  }
)

export const Button = forwardRef<HTMLButtonElement, BasicProps & {
  colorScheme?: string
  disabled?: boolean
  isDisabled?: boolean
  isLoading?: boolean
  leftIcon?: ReactNode
  size?: string
  type?: 'button' | 'submit' | 'reset'
  variant?: string
}>(
  function Button({ children, colorScheme, isDisabled, isLoading, leftIcon, variant, ...props }, ref) {
    const actualVariant =
      colorScheme === 'red'
        ? 'destructive'
        : colorScheme === 'teal' || colorScheme === 'blue'
          ? 'primary'
          : variant === 'ghost'
            ? 'ghost'
            : variant === 'outline'
              ? 'outline'
              : 'outline'

    return (
      <UIButton
        className={props.className}
        disabled={isDisabled || isLoading}
        ref={ref}
        style={{ ...toStyle(props), ...props.style }}
        variant={actualVariant as never}
        {...props}
      >
        {leftIcon}
        {isLoading ? 'Loading...' : children}
      </UIButton>
    )
  }
)

export const IconButton = forwardRef<HTMLButtonElement, BasicProps & {
  'aria-label': string
  colorScheme?: string
  icon?: ReactNode
  isLoading?: boolean
  isDisabled?: boolean
  variant?: string
}>(
  function IconButton({ icon, isLoading, children, ...props }, ref) {
    return (
      <Button
        ref={ref}
        size="icon"
        {...props}
      >
        {isLoading ? '...' : icon ?? children}
      </Button>
    )
  }
)

export function Tooltip({ children, label }: { children: ReactNode; label: ReactNode; [key: string]: unknown }) {
  return <UITooltip content={label}>{children}</UITooltip>
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & BasicProps>(
  function Input({ style, ...props }, ref) {
    return <UIInput ref={ref} style={{ ...toStyle(props), ...style }} {...props} />
  }
)

export function InputGroup({ children }: { children: ReactNode; [key: string]: any }) {
  return <div className="relative w-full">{children}</div>
}

export function InputRightElement({ children, width }: { children: ReactNode; width?: string }) {
  return (
    <div
      className="absolute inset-y-0 right-0 flex items-center justify-center"
      style={{ width }}
    >
      {children}
    </div>
  )
}

export function FormControl({ children, isInvalid }: { children: ReactNode; isInvalid?: boolean } & BasicProps) {
  return <div data-invalid={isInvalid}>{children}</div>
}

export function FormLabel({ children, ...props }: BasicProps & { htmlFor?: string }) {
  return (
    <label
      className="mb-2 block text-sm font-medium text-[color:var(--color-foreground)]"
      style={toStyle(props)}
      {...props}
    >
      {children}
    </label>
  )
}

export function FormErrorMessage({ children }: { children?: ReactNode }) {
  return children ? <div className="mt-1 text-sm text-[color:var(--color-danger)]">{children}</div> : null
}

export function Spinner({ size }: { size?: string } = {}) {
  return <div className="size-8 animate-spin rounded-full border-2 border-[color:var(--color-border)] border-t-[color:var(--color-primary)]" />
}

export function Alert({ children, status = 'info', ...props }: { children: ReactNode; status?: string } & BasicProps) {
  const className =
    status === 'error'
      ? 'border-[color:var(--color-danger)] bg-[color:var(--color-danger-bg)] text-[color:var(--color-danger)]'
      : status === 'success'
        ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
        : status === 'warning'
          ? 'border-amber-400/40 bg-amber-500/10 text-amber-300'
          : 'border-[color:var(--color-border)] bg-[color:var(--color-card)]'
  return <div className={`rounded-[var(--radius-md)] border px-3 py-2 ${className}`} style={toStyle(props)}>{children}</div>
}

export function Progress({ value = 0, max = 100, ...props }: { value?: number; max?: number } & BasicProps) {
  const width = `${(value / max) * 100}%`
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-border)]" style={toStyle(props)}>
      <div className="h-full bg-[color:var(--color-primary)]" style={{ width }} />
    </div>
  )
}

export function Select({ children, style, ...props }: SelectHTMLAttributes<HTMLSelectElement> & BasicProps) {
  return (
    <select
      className="h-10 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 text-sm"
      style={{ ...toStyle(props), ...style }}
      {...props}
    >
      {children}
    </select>
  )
}

export function Checkbox({ children, isChecked, ...props }: InputHTMLAttributes<HTMLInputElement> & { isChecked?: boolean; children?: ReactNode; [key: string]: any }) {
  return (
    <label className="inline-flex items-center gap-2" style={toStyle(props as BasicProps)}>
      <input checked={isChecked} type="checkbox" {...props} />
      <span>{children}</span>
    </label>
  )
}

export function Badge({ children, ...props }: BasicProps) {
  return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium" style={toStyle(props)}>{children}</span>
}

export function Stat({ children, ...props }: BasicProps) {
  return <div style={toStyle(props)} {...props}>{children}</div>
}

export function Avatar({ src, size, ...props }: { src?: string; size?: string; [key: string]: any }) {
  const dimension = size === 'xl' ? 96 : size === 'sm' ? 32 : 40
  return <img alt="" className="rounded-full object-cover" src={src} style={{ width: dimension, height: dimension, ...toStyle(props as BasicProps) }} />
}

export function CloseButton(props: { onClick?: () => void } & BasicProps) {
  return <button type="button" {...props}>x</button>
}

export function Icon({ as: Component, ...props }: { as: any } & BasicProps) {
  return <Component style={toStyle(props)} />
}

const DisclosureContext = createContext<{ isOpen: boolean; onClose: () => void } | null>(null)

export function useDisclosure({ defaultIsOpen = false }: { defaultIsOpen?: boolean } = {}) {
  const [isOpen, setIsOpen] = useState(defaultIsOpen)
  return {
    isOpen,
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
    onToggle: () => setIsOpen((v) => !v)
  }
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useThemeMode()
  return colorMode === 'light' ? light : dark
}

export function useToast() {
  return useAppToast()
}

export function List({ children, ...props }: { children: ReactNode } & BasicProps) {
  return <ul style={toStyle(props)}>{children}</ul>
}

export function ListItem({ children, ...props }: { children: ReactNode } & BasicProps) {
  return <li style={toStyle(props)}>{children}</li>
}

export function ListIcon({ as: Component, color }: { as: any; color?: string }) {
  return <Component className="mr-2 inline-block" style={{ color: color ? colorMap[color] ?? color : undefined }} />
}

export function FormHelperText({ children }: { children?: ReactNode }) {
  return children ? <div className="mt-1 text-xs text-[color:var(--color-muted)]">{children}</div> : null
}

export function RadioGroup({ children }: { children: ReactNode; [key: string]: any }) {
  return <>{children}</>
}

export function Radio({ children, value, ...props }: { children: ReactNode; value: string; [key: string]: any } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-start gap-2">
      <input type="radio" value={value} {...props} />
      <span>{children}</span>
    </label>
  )
}

export function Menu({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const value = useMemo(
    () => ({
      isOpen,
      onClose: () => setIsOpen(false),
      onToggle: () => setIsOpen((currentValue) => !currentValue)
    }),
    [isOpen]
  )
  return <DisclosureContext.Provider value={value}>{children}</DisclosureContext.Provider>
}

export function MenuButton({ children, as: Component = 'button', onClick, ...props }: any) {
  const ctx = useContext(DisclosureContext) as { onToggle?: () => void } | null
  return (
    <Component
      onClick={(event: any) => {
        onClick?.(event)
        ctx?.onToggle?.()
      }}
      {...props}
    >
      {children}
    </Component>
  )
}

export function MenuList({ children, ...props }: { children: ReactNode } & BasicProps) {
  const ctx = useContext(DisclosureContext) as { isOpen?: boolean } | null
  if (!ctx?.isOpen) {
    return null
  }
  return <div className="absolute z-50 mt-2 min-w-[180px] rounded-[var(--radius-md)] border bg-[color:var(--color-card)] p-1 shadow-lg" style={toStyle(props)}>{children}</div>
}

export function MenuItem({ children, ...props }: { children: ReactNode } & BasicProps) {
  return <button className="flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-[color:var(--color-accent)]/40" type="button" style={toStyle(props)} {...props}>{children}</button>
}

export function MenuDivider() {
  return <div className="my-1 h-px bg-[color:var(--color-border)]" />
}

export function Drawer({ children, isOpen }: { children: ReactNode; isOpen: boolean; [key: string]: any }) {
  if (!isOpen) return null
  return <div className="fixed inset-0 z-40 bg-black/50">{children}</div>
}

export function DrawerContent({ children }: { children: ReactNode; [key: string]: any }) {
  return <div className="h-full w-[320px] bg-[color:var(--color-card)]">{children}</div>
}

export function Collapse({ children, in: isOpen }: { children: ReactNode; in: boolean; [key: string]: any }) {
  return isOpen ? <div>{children}</div> : null
}

export function NumberInput({ children, value, onChange, min, ...props }: any) {
  return <div {...props}>{children({ value, onChange, min })}</div>
}

export function NumberInputField(props: any) {
  return <UIInput type="number" {...props} />
}

export function NumberInputStepper() {
  return null
}
export function NumberIncrementStepper() {
  return null
}
export function NumberDecrementStepper() {
  return null
}

export function AlertDialog({ children, isOpen }: { children: ReactNode; isOpen: boolean; [key: string]: any }) {
  if (!isOpen) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">{children}</div>
}
export function AlertDialogOverlay({ children }: { children?: ReactNode; [key: string]: any }) { return <>{children}</> }
export function AlertDialogContent({ children }: { children: ReactNode; [key: string]: any }) { return <div className="relative w-full max-w-md rounded-[var(--radius-lg)] border bg-[color:var(--color-card)] p-6 shadow-xl">{children}</div> }
export function AlertDialogHeader({ children, ...props }: { children: ReactNode } & BasicProps) { return <h2 className="text-lg font-bold" style={toStyle(props)}>{children}</h2> }
export function AlertDialogBody({ children, ...props }: { children: ReactNode } & BasicProps) { return <div className="mt-3" style={toStyle(props)}>{children}</div> }
export function AlertDialogFooter({ children, ...props }: { children: ReactNode; [key: string]: any }) { return <div className="mt-5 flex justify-end gap-3" style={toStyle(props)}>{children}</div> }
export function AlertDialogCloseButton({ onClick }: { onClick?: () => void; [key: string]: any }) { return <button className="absolute right-4 top-4" onClick={onClick} type="button">x</button> }

export const Modal = AlertDialog
export const ModalOverlay = AlertDialogOverlay
export const ModalContent = AlertDialogContent
export const ModalHeader = AlertDialogHeader
export const ModalBody = AlertDialogBody
export const ModalFooter = AlertDialogFooter
export const ModalCloseButton = AlertDialogCloseButton

export function SimpleGrid({ children }: { children: ReactNode; [key: string]: any }) { return <div className="grid gap-4">{children}</div> }
export const Table = createElement('table')
export const Thead = createElement('thead')
export const Tbody = createElement('tbody')
export const Tr = createElement('tr')
export const Th = createElement('th')
export const Td = createElement('td')
export const TableContainer = createElement('div')
