import { useMemo } from 'react'
import { useApp, type Lang } from '@/store'
import type { Txt } from '@/data/school'
import { en } from './en'
import { hi } from './hi'
import { mr } from './mr'

export type Key = keyof typeof en
export type Dict = Record<Key, string>

const DICTS: Record<Lang, Dict> = { en, hi, mr }
const LOCALES: Record<Lang, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' }
export const LANG_NAMES: Record<Lang, string> = { en: 'English', hi: 'हिंदी', mr: 'मराठी' }

function makeI18n(lang: Lang) {
  const loc = LOCALES[lang]
  const t = (key: Key, vars?: Record<string, string | number>) => {
    const s = DICTS[lang][key]
    return vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '')) : s
  }
  const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, { numberingSystem: 'latn', ...opts })
  const day = fmt({ weekday: 'long', day: 'numeric', month: 'long' })
  const dayShort = fmt({ weekday: 'short', day: 'numeric', month: 'short' })
  const dm = fmt({ day: 'numeric', month: 'short' })
  const dmy = fmt({ day: 'numeric', month: 'short', year: 'numeric' })
  const wd = fmt({ weekday: 'short' })
  const wdLong = fmt({ weekday: 'long' })
  const month = fmt({ month: 'long', year: 'numeric' })
  const monthShort = fmt({ month: 'short' })
  const time = fmt({ hour: 'numeric', minute: '2-digit' })
  const num = new Intl.NumberFormat(loc, { numberingSystem: 'latn' })
  const money = new Intl.NumberFormat(loc, { numberingSystem: 'latn', style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
  return {
    lang,
    t,
    tx: (x: Txt | string) => (typeof x === 'string' ? x : x[lang]),
    d: {
      day: (x: Date) => day.format(x),
      short: (x: Date) => dayShort.format(x),
      dm: (x: Date) => dm.format(x),
      dmy: (x: Date) => dmy.format(x),
      wd: (x: Date) => wd.format(x),
      wdLong: (x: Date) => wdLong.format(x),
      month: (x: Date) => month.format(x),
      monthShort: (x: Date) => monthShort.format(x),
      time: (x: Date | number) => time.format(x),
    },
    num: (n: number) => num.format(n),
    money: (n: number) => money.format(n),
    mins: (m: number) => (m >= 60 ? t('c.hrMin', { h: Math.floor(m / 60), m: m % 60 }) : t('c.min', { n: m })),
  }
}

export type I18n = ReturnType<typeof makeI18n>

export function useI18n() {
  const lang = useApp((s) => s.settings.lang)
  return useMemo(() => makeI18n(lang), [lang])
}
