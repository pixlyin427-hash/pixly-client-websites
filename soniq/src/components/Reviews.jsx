import { REVIEWS, REVIEW_LABEL, reviewsFor } from '../data/catalog'
import { Stars } from './ui'

export function ReviewLabel() {
  return <p className="label-box" role="note"><strong>Fictional</strong><span>{REVIEW_LABEL}</span></p>
}
export default function Reviews({ cat }) {
  const list = cat ? reviewsFor(cat) : REVIEWS
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <ReviewLabel />
      <div className="reviews">
        {list.map((r) => (
          <figure key={r.name} className="panel review pad" style={{ margin: 0 }}>
            <Stars value={r.rating} />
            <blockquote>“{r.text}”</blockquote>
            <figcaption className="fine"><b style={{ color: '#fff' }}>{r.name}</b> · {r.place} · <span>Prototype review</span></figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
