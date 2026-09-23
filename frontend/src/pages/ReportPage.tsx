import { CheckCircle2, CircleAlert, CircleDashed, Wrench } from 'lucide-react'
import { useWearline } from '../context/WearlineContext'

function icon(verdict: string) {
  if (verdict === 'SATISFIED') return <CheckCircle2 />
  if (verdict === 'INCONCLUSIVE') return <CircleAlert />
  if (verdict) return <Wrench />
  return <CircleDashed />
}

export function ReportPage() {
  const { order, requirements } = useWearline()
  if (!order) return <section className="empty"><h2>No work order loaded.</h2></section>
  return <section className="stack"><div className="report-head"><div><span className="eyebrow">Deterministic aggregate</span><h2>{order.title}</h2><p>{order.scope_summary}</p></div><div className={`result ${String(order.result || 'PENDING').toLowerCase()}`}><span>Work-order result</span><strong>{order.result || 'PENDING'}</strong><small>{order.verified_count} / {order.requirement_count} verified</small></div></div><div className="report-grid">{requirements.map((r) => <article className="report-card" key={r.index}><div className="report-icon">{icon(r.verdict)}</div><div><span className="eyebrow">Requirement {r.index + 1}</span><h3>{r.label}</h3><p>{r.acceptance_criterion}</p><div className="verdict-row"><strong>{r.verdict || 'PENDING'}</strong><span>{r.evidence_count} artifact(s) · revision {r.evidence_revision}</span></div>{r.reasoning && <blockquote>{r.reasoning}</blockquote>}</div></article>)}</div></section>
}
