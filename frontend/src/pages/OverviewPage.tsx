import { ArrowRight, FileLock2, Images, ListChecks, Scale } from 'lucide-react'
import { useWearline } from '../context/WearlineContext'

export function OverviewPage({ onStart }: { onStart: () => void }) {
  const { order } = useWearline()
  return <section className="stack">
    <div className="hero-card">
      <div className="hero-copy"><span className="kicker">Wearline</span><h2>Completion evidence, judged against frozen requirements.</h2><p>Break a physical work scope into atomic acceptance criteria. The remediator submits one or two completion-proof artifacts per requirement. GenLayer verifies each requirement independently, then the contract derives the final compliance report.</p><button className="primary" onClick={onStart}>Open work order <ArrowRight size={16}/></button></div>
      <div className="hero-grid">
        <div><FileLock2/><span>01</span><strong>Freeze specification</strong><p>Scope and atomic acceptance criteria become immutable before proof is submitted.</p></div>
        <div><Images/><span>02</span><strong>Submit proof package</strong><p>Up to three hash-pinned completion images support each individual requirement.</p></div>
        <div><ListChecks/><span>03</span><strong>Verify requirement</strong><p>Validators independently reproduce the bounded requirement-level judgment.</p></div>
        <div><Scale/><span>04</span><strong>Derive report</strong><p>Contract logic maps all requirement outcomes to the final work-order result.</p></div>
      </div>
    </div>
    <div className="metrics">
      <article><span>Core question</span><strong>“Does this proof satisfy this exact criterion?”</strong></article>
      <article><span>Economic surface</span><strong>None</strong><small>No value-bearing writes or transfers.</small></article>
      <article><span>Loaded work order</span><strong>{order ? `#${order.id}` : 'None'}</strong><small>{order?.status ?? 'Load or create one to begin.'}</small></article>
    </div>
  </section>
}
