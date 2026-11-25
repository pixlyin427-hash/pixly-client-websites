import clsx from 'clsx'

/** STKV crest placeholder (shield with an open book). Replace with the official logo when available. */
export function Crest({ className, plain }: { className?: string; plain?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={clsx('shrink-0', className)} role="img" aria-label="STKV">
      {!plain && <rect width="64" height="64" rx="18" fill="#F4F7FC" />}
      <path d="M32 11 16 17v12c0 10.5 6.8 17.4 16 21 9.2-3.6 16-10.5 16-21V17z" fill="#142B50" />
      <path d="M24 25c2.9-1.3 5.6-1.3 8 .5 2.4-1.8 5.1-1.8 8-.5v12c-2.9-1.3-5.6-1.3-8 .5-2.4-1.8-5.1-1.8-8-.5z" fill="none" stroke="#F4F7FC" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M32 25.5V37" stroke="#F0A52B" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
