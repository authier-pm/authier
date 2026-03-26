import { cn } from '@src/lib/cn'

type ProgressCircleProps = {
  className?: string
  max: number
  size?: number
  value: number
  valueLabel: string
}

export function ProgressCircle({
  className,
  max,
  size = 40,
  value,
  valueLabel
}: ProgressCircleProps) {
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(value / max, 0), 1)
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div
      aria-label={valueLabel}
      className={cn(
        'relative inline-flex items-center justify-center text-[11px] font-semibold text-[color:var(--color-foreground)]',
        className
      )}
      role="progressbar"
    >
      <svg height={size} width={size}>
        <circle
          className="stroke-[color:var(--color-border)]"
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="stroke-[color:var(--color-primary)]"
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="absolute">{valueLabel}</span>
    </div>
  )
}
