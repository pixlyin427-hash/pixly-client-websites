import { useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { motion } from 'motion/react'
import clsx from 'clsx'
import { Check, ChevronDown, CircleAlert, Delete, type LucideIcon } from 'lucide-react'
import { spring } from '@/lib/motion'
import { Sheet } from './overlay'

const inputCls = 'w-full rounded-2xl bg-muted px-3.5 text-base text-ink outline-none transition-[box-shadow,background-color] duration-200 placeholder:text-ink-3 focus:bg-surface focus:shadow-[inset_0_0_0_2px_var(--color-royal),0_0_0_4px_rgb(36_87_197/0.14)] dark:focus:shadow-[inset_0_0_0_2px_var(--color-sky),0_0_0_4px_rgb(98_165_245/0.16)]'
const errCls = 'bg-surface shadow-[inset_0_0_0_2px_var(--color-error),0_0_0_4px_rgb(196_61_69/0.12)]'

function Field({ label, error, help, children, id }: { label: string; error?: string; help?: string; children: ReactNode; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12.5px] font-semibold text-ink-2">{label}</label>
      <motion.div key={error} animate={error ? { x: [0, -6, 6, -4, 4, 0] } : undefined} transition={{ duration: 0.36 }}>
        {children}
      </motion.div>
      {error ? (
        <p id={`${id}-err`} className="flex items-center gap-1.5 text-[12.5px] text-error-ink" role="alert"><CircleAlert className="size-4 shrink-0" />{error}</p>
      ) : help ? (
        <p className="text-[12.5px] text-ink-3">{help}</p>
      ) : null}
    </div>
  )
}

export function Input({ label, error, help, icon: Icon, end, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; help?: string; icon?: LucideIcon; end?: ReactNode }) {
  const id = useId()
  return (
    <Field label={label} error={error} help={help} id={id}>
      <div className="relative flex items-center">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 size-5 text-ink-3" strokeWidth={1.9} />}
        <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={clsx(inputCls, 'h-[52px]', Icon && 'pl-11', end && 'pr-12', error && errCls, className)} {...rest} />
        {end && <span className="absolute right-1.5">{end}</span>}
      </div>
    </Field>
  )
}

export function Textarea({ label, error, help, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; help?: string }) {
  const id = useId()
  return (
    <Field label={label} error={error} help={help} id={id}>
      <textarea id={id} aria-invalid={!!error} className={clsx(inputCls, 'min-h-24 resize-none py-3 leading-[22px]', error && errCls, className)} {...rest} />
    </Field>
  )
}

export type Option<T extends string> = { id: T; label: string; icon?: LucideIcon; sub?: string }

/** Radio-style list used in sheets and forms. */
export function Options<T extends string>({ options, value, onChange, label }: { options: Option<T>[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-1.5">
      {options.map((o) => {
        const on = o.id === value
        return (
          <motion.button
            key={o.id}
            role="radio"
            aria-checked={on}
            whileTap={{ scale: 0.98 }}
            transition={spring.tap}
            onClick={() => onChange(o.id)}
            className={clsx('flex min-h-14 items-center gap-3 rounded-[18px] px-3.5 py-2.5 text-left transition-[background-color,box-shadow] duration-200', on ? 'bg-ice shadow-[inset_0_0_0_1.5px_var(--color-royal)]' : 'bg-bg')}
          >
            {o.icon && <o.icon className="size-5 text-royal dark:text-sky" strokeWidth={1.9} />}
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{o.label}</span>
              {o.sub && <span className="block text-[12.5px] text-ink-3">{o.sub}</span>}
            </span>
            <span className={clsx('size-[22px] shrink-0 rounded-full transition-shadow duration-200', on ? 'shadow-[inset_0_0_0_7px_var(--color-royal)]' : 'shadow-[inset_0_0_0_2px_var(--border-strong)]')} />
          </motion.button>
        )
      })}
    </div>
  )
}

/** Picker: looks like a field, opens a bottom sheet of options (app-style select). */
export function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Option<T>[]; onChange: (v: T) => void }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const cur = options.find((o) => o.id === value)
  return (
    <Field label={label} id={id}>
      <motion.button id={id} type="button" whileTap={{ scale: 0.985 }} onClick={() => setOpen(true)} aria-haspopup="dialog" className={clsx(inputCls, 'flex h-[52px] items-center gap-2.5 text-left')}>
        {cur?.icon && <cur.icon className="size-5 text-royal dark:text-sky" strokeWidth={1.9} />}
        <span className="flex-1 truncate">{cur?.label}</span>
        <ChevronDown className="size-5 text-ink-3" />
      </motion.button>
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <Options label={label} options={options} value={value} onChange={(v) => { onChange(v); setOpen(false) }} />
      </Sheet>
    </Field>
  )
}

function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx('group relative h-8 w-[52px] shrink-0 rounded-full transition-colors duration-300 disabled:opacity-45', checked ? 'bg-royal' : 'bg-line-strong')}
    >
      <motion.span
        layout
        transition={spring.indicator}
        className={clsx('absolute top-[3px] h-[26px] w-[26px] rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2),0_2px_6px_rgb(0_0_0/0.12)] group-active:w-[30px]', checked ? 'right-[3px]' : 'left-[3px]')}
      />
    </button>
  )
}

export function SwitchRow({ icon, title, sub, checked, onChange, disabled, tone }: { icon?: ReactNode; title: string; sub?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; tone?: string }) {
  return (
    <div className={clsx('relative flex min-h-14 items-center gap-3 px-3 py-2.5', tone)}>
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-semibold tracking-[-0.01em]">{title}</span>
        {sub && <span className="block text-[12.5px] text-ink-3">{sub}</span>}
      </span>
      <Switch checked={checked} onChange={onChange} label={title} disabled={disabled} />
    </div>
  )
}

/** Pill segmented control with a sliding thumb. */
export function Segmented<T extends string>({ options, value, onChange, label, className }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string; className?: string }) {
  const lid = useId()
  return (
    <div role="tablist" aria-label={label} className={clsx('flex rounded-full bg-muted p-1', className)}>
      {options.map((o) => (
        <button key={o.id} role="tab" aria-selected={o.id === value} onClick={() => onChange(o.id)} className={clsx('relative h-9 min-w-0 flex-1 rounded-full px-2 text-[13px] font-semibold transition-colors', o.id === value ? 'text-ink' : 'text-ink-2')}>
          {o.id === value && <motion.span layoutId={lid} transition={spring.indicator} className="absolute inset-0 rounded-full bg-raised shadow-[0_1px_2px_rgb(20_43_80/0.12),0_4px_10px_rgb(20_43_80/0.08)]" />}
          <span className="relative truncate">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

/** Underline tabs for switching sections inside a screen. */
export function Tabs<T extends string>({ options, value, onChange, label }: { options: { id: T; label: string; badge?: number }[]; value: T; onChange: (v: T) => void; label: string }) {
  const lid = useId()
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar -mx-5 flex gap-6 overflow-x-auto border-b border-line px-5 md:mx-0 md:px-0">
      {options.map((o) => (
        <button key={o.id} role="tab" aria-selected={o.id === value} onClick={() => onChange(o.id)} className={clsx('relative flex shrink-0 items-center gap-1.5 pt-2.5 pb-3 text-sm font-semibold transition-colors', o.id === value ? 'text-ink' : 'text-ink-3')}>
          {o.label}
          {!!o.badge && <span className="min-w-[18px] rounded-full bg-royal px-1 text-center font-mono text-[10px] leading-[18px] text-white">{o.badge}</span>}
          {o.id === value && <motion.span layoutId={lid} transition={spring.indicator} className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-[3px] bg-royal dark:bg-sky" />}
        </button>
      ))}
    </div>
  )
}

/** Filter chip row (single select). */
export function Chips<T extends string>({ options, value, onChange, label }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-0.5 md:mx-0 md:px-0">
      {options.map((o) => {
        const on = o.id === value
        return (
          <motion.button
            key={o.id}
            role="radio"
            aria-checked={on}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(o.id)}
            className={clsx('flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-semibold transition-colors duration-200', on ? 'bg-navy text-white dark:bg-royal' : 'bg-surface text-ink-2 shadow-[inset_0_0_0_1px_var(--border)]')}
          >
            {on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring.celebrate}><Check className="size-4" strokeWidth={2.4} /></motion.span>}
            {o.label}
          </motion.button>
        )
      })}
    </div>
  )
}

/** Four-digit PIN pad. */
export function PinPad({ onDone, error, label, delLabel }: { onDone: (pin: string) => void; error?: string; label: string; delLabel: string }) {
  const [pin, setPin] = useState('')
  const press = (d: string) => {
    const next = (pin + d).slice(0, 4)
    setPin(next)
    if (next.length === 4) setTimeout(() => { onDone(next); setPin('') }, 140)
  }
  return (
    <div className="flex flex-col items-center gap-5" aria-label={label}>
      <motion.div key={error} animate={error ? { x: [0, -8, 8, -5, 5, 0] } : undefined} className="flex gap-3.5" aria-live="polite" aria-label={`${pin.length}/4`}>
        {[0, 1, 2, 3].map((i) => (
          <motion.span key={i} animate={{ scale: i < pin.length ? 1.15 : 1 }} className={clsx('size-3.5 rounded-full transition-colors', i < pin.length ? 'bg-royal dark:bg-sky' : 'bg-line-strong')} />
        ))}
      </motion.div>
      {error && <p className="text-[13px] font-medium text-error-ink" role="alert">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k, i) =>
          k === '' ? <span key={i} /> : (
            <motion.button
              key={i}
              whileTap={{ scale: 0.9 }}
              transition={spring.tap}
              aria-label={k === 'del' ? delLabel : k}
              onClick={() => (k === 'del' ? setPin(pin.slice(0, -1)) : press(k))}
              className="grid size-[68px] place-items-center rounded-full bg-muted text-[24px] font-semibold"
            >
              {k === 'del' ? <Delete className="size-6" /> : k}
            </motion.button>
          ),
        )}
      </div>
    </div>
  )
}
