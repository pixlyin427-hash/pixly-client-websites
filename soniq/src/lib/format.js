const inr = new Intl.NumberFormat('en-IN')
export const rupees = (n) => `₹${inr.format(n)}`
export const pct = (a, b) => Math.round(((b - a) / b) * 100)
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
