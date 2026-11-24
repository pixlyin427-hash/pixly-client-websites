export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const TODAY = startOfDay(new Date())
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const sameDay = (a: Date, b: Date) => dayKey(a) === dayKey(b)
export const daysBetween = (a: Date, b: Date) => Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 864e5)

/** Weekday school holidays, placed relative to today so the demo calendar always has some. */
export const HOLIDAYS = new Set([-23, -9, 12].map((n) => dayKey(addDays(TODAY, n))))

export const isSchoolDay = (d: Date) => d.getDay() !== 0 && !HOLIDAYS.has(dayKey(d))

export function nextSchoolDay(from: Date, n = 1) {
  let d = from
  for (let i = 0; i < n; ) {
    d = addDays(d, 1)
    if (isSchoolDay(d)) i++
  }
  return d
}

export function prevSchoolDay(from: Date, n = 1) {
  let d = from
  for (let i = 0; i < n; ) {
    d = addDays(d, -1)
    if (isSchoolDay(d)) i++
  }
  return d
}

/** Minutes since midnight. */
export const nowMinutes = () => {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}


export const fromKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}
