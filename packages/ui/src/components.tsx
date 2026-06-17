import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from 'react'
import { cls, confidenceToColour, toneChipClasses, verdictLabel } from './tokens'

/* ─── Layout ─────────────────────────────────────────────── */

export function Container({
  className,
  size = 'default',
  ...props
}: HTMLAttributes<HTMLDivElement> & { size?: 'default' | 'narrow' | 'wide' }) {
  const width = size === 'narrow' ? 'max-w-2xl' : size === 'wide' ? 'max-w-6xl' : 'max-w-content'
  return <div className={cls('mx-auto w-full px-5 sm:px-8', width, className)} {...props} />
}

/* ─── Buttons ────────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSurface = 'light' | 'dark'

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  surface: ButtonSurface = 'light',
  className?: string,
): string {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants: Record<ButtonSurface, Record<ButtonVariant, string>> = {
    light: {
      primary: 'bg-forest-800 text-parchment hover:bg-forest-900 focus-visible:ring-forest-800 focus-visible:ring-offset-parchment',
      secondary: 'bg-forest-50 text-forest-800 border border-forest-200 hover:bg-forest-100 focus-visible:ring-forest-300 focus-visible:ring-offset-parchment',
      ghost: 'text-forest-800 hover:bg-forest-50 focus-visible:ring-forest-300 focus-visible:ring-offset-parchment',
    },
    dark: {
      primary: 'bg-emerald-500 text-forest-950 hover:bg-emerald-400 focus-visible:ring-emerald-400 focus-visible:ring-offset-forest-950',
      secondary: 'bg-white/5 text-zinc-100 border border-white/10 hover:bg-white/10 focus-visible:ring-white/30 focus-visible:ring-offset-forest-950',
      ghost: 'text-zinc-300 hover:bg-white/5 focus-visible:ring-white/20 focus-visible:ring-offset-forest-950',
    },
  }
  return cls(base, variants[surface][variant], className)
}

export function Button({
  variant = 'primary',
  surface = 'light',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; surface?: ButtonSurface }) {
  return <button className={buttonClasses(variant, surface, className)} {...props} />
}

export function ButtonLink({
  variant = 'primary',
  surface = 'light',
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant; surface?: ButtonSurface }) {
  return <a className={buttonClasses(variant, surface, className)} {...props} />
}

/* ─── Inputs ─────────────────────────────────────────────── */

export function Input({
  className,
  surface = 'light',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { surface?: ButtonSurface }) {
  const styles =
    surface === 'dark'
      ? 'bg-white/5 border-white/10 text-zinc-100 placeholder-zinc-500 focus:border-emerald-400/60 focus:ring-emerald-400/20'
      : 'bg-white border-forest-200 text-ink placeholder-ink-muted focus:border-forest-500 focus:ring-forest-500/20'
  return (
    <input
      className={cls(
        'w-full rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-4',
        styles,
        className,
      )}
      {...props}
    />
  )
}

/* ─── Surfaces ───────────────────────────────────────────── */

export function Card({
  className,
  surface = 'light',
  ...props
}: HTMLAttributes<HTMLDivElement> & { surface?: ButtonSurface }) {
  const styles =
    surface === 'dark'
      ? 'border-white/10 bg-white/[0.03]'
      : 'border-forest-100 bg-white shadow-card'
  return <div className={cls('rounded-card border p-6', styles, className)} {...props} />
}

/* ─── Typography helpers ─────────────────────────────────── */

export function Eyebrow({
  className,
  surface = 'light',
  children,
}: {
  className?: string
  surface?: ButtonSurface
  children: ReactNode
}) {
  const colour = surface === 'dark' ? 'text-emerald-400' : 'text-forest-600'
  return (
    <span className={cls('inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]', colour, className)}>
      {children}
    </span>
  )
}

/* ─── Verdict chip ───────────────────────────────────────── */

export function StatusChip({
  verdict,
  label,
  surface = 'light',
  className,
}: {
  verdict: string
  label?: string
  surface?: ButtonSurface
  className?: string
}) {
  return (
    <span
      className={cls(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        toneChipClasses(verdict, surface),
        className,
      )}
    >
      {label ?? verdictLabel(verdict)}
    </span>
  )
}

/* ─── Confidence gauge (pure SVG) ────────────────────────── */

export function ConfidenceGauge({
  value,
  low,
  high,
  size = 180,
  surface = 'light',
  caption = 'confidence',
}: {
  value: number
  low?: number | null
  high?: number | null
  size?: number
  surface?: ButtonSurface
  caption?: string
}) {
  const stroke = Math.round(size * 0.07)
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const arcLen = Math.PI * r
  const clamp = (n: number) => Math.max(0, Math.min(100, n))
  const v = clamp(value)
  const colour = confidenceToColour(v)
  const track = surface === 'dark' ? 'rgba(255,255,255,0.10)' : '#e7ddc8'
  const numberColour = surface === 'dark' ? '#fafafa' : '#1c1c1e'
  const captionColour = surface === 'dark' ? '#a1a1aa' : '#8a8a8e'
  const semicircle = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`

  const hasBand = low != null && high != null && high > low
  const bandStart = hasBand ? clamp(low as number) : 0
  const bandWidth = hasBand ? clamp(high as number) - bandStart : 0

  return (
    <svg width={size} height={cy + stroke} viewBox={`0 0 ${size} ${cy + stroke}`} role="img" aria-label={`${v}% ${caption}`}>
      <path d={semicircle} fill="none" stroke={track} strokeWidth={stroke} strokeLinecap="round" />
      {hasBand && (
        <path
          d={semicircle}
          fill="none"
          stroke={colour}
          strokeOpacity={0.22}
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${(bandWidth / 100) * arcLen} ${arcLen}`}
          strokeDashoffset={`${-(bandStart / 100) * arcLen}`}
        />
      )}
      <path
        d={semicircle}
        fill="none"
        stroke={colour}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${(v / 100) * arcLen} ${arcLen}`}
      />
      <text x={cx} y={cy - size * 0.04} textAnchor="middle" fontSize={size * 0.22} fontWeight={700} fill={numberColour} fontFamily="var(--font-inter), Inter, sans-serif">
        {Math.round(v)}%
      </text>
      <text x={cx} y={cy + size * 0.06} textAnchor="middle" fontSize={size * 0.07} fill={captionColour} fontFamily="var(--font-inter), Inter, sans-serif" letterSpacing="0.05em">
        {caption}
      </text>
    </svg>
  )
}

/* ─── Signal bar ─────────────────────────────────────────── */

export function SignalBar({
  label,
  value,
  surface = 'light',
  hint,
}: {
  label: string
  value: number
  surface?: ButtonSurface
  hint?: string
}) {
  const pct = Math.max(0, Math.min(100, value))
  const colour = confidenceToColour(pct)
  const track = surface === 'dark' ? 'bg-white/10' : 'bg-parchment-300'
  const labelColour = surface === 'dark' ? 'text-zinc-300' : 'text-ink-secondary'
  const valueColour = surface === 'dark' ? 'text-zinc-100' : 'text-ink'
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className={cls('text-xs font-medium', labelColour)}>{label}</span>
        <span className={cls('font-mono text-xs tabular-nums', valueColour)}>{Math.round(pct)}%</span>
      </div>
      <div className={cls('h-1.5 w-full overflow-hidden rounded-full', track)}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colour }} />
      </div>
      {hint && <p className={cls('mt-1 text-[11px]', surface === 'dark' ? 'text-zinc-500' : 'text-ink-muted')}>{hint}</p>}
    </div>
  )
}

/* ─── Stat ───────────────────────────────────────────────── */

export function Stat({
  value,
  label,
  surface = 'light',
}: {
  value: ReactNode
  label: string
  surface?: ButtonSurface
}) {
  return (
    <div>
      <div className={cls('font-serif text-2xl', surface === 'dark' ? 'text-white' : 'text-forest-900')}>{value}</div>
      <div className={cls('mt-1 text-sm', surface === 'dark' ? 'text-zinc-400' : 'text-ink-secondary')}>{label}</div>
    </div>
  )
}

/* ─── Brand wordmark ─────────────────────────────────────── */

export function ShieldMark({ className, color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3Z" fill={color} fillOpacity={0.12} stroke={color} strokeWidth={1.5} />
      <path d="m8.5 12 2.5 2.5 4.5-5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
