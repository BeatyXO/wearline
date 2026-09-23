import { useState } from 'react'
import { useWearline } from '../context/WearlineContext'

export function WorkOrderPage() {
  const { order, requirements, busy, load, createWorkOrder, addRequirement, sealWorkOrder } = useWearline()
  const [lookup, setLookup] = useState('')
  const [remediator, setRemediator] = useState('')
  const [title, setTitle] = useState('')
  const [scope, setScope] = useState('')
  const [label, setLabel] = useState('')
  const [criterion, setCriterion] = useState('')
  const [guidance, setGuidance] = useState('')

  return <section className="two-col">
    <div className="stack">
      <div className="panel"><div className="panel-head"><div><span className="eyebrow">Find</span><h2>Load a work order</h2></div></div><div className="inline"><input value={lookup} onChange={(e) => setLookup(e.target.value)} placeholder="Work order ID"/><button className="secondary" disabled={busy || !lookup} onClick={() => void load(lookup)}>Load</button></div></div>
      <div className="panel"><div className="panel-head"><div><span className="eyebrow">Create</span><h2>Freeze the scope</h2></div></div><label>Remediator address<input value={remediator} onChange={(e) => setRemediator(e.target.value)} placeholder="0x…"/></label><label>Work order title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pump-room remediation closeout"/></label><label>Scope summary<textarea value={scope} onChange={(e) => setScope(e.target.value)} placeholder="Describe the bounded physical work scope and what this closeout package covers."/></label><button className="primary" disabled={busy || !remediator || !title || !scope} onClick={() => void createWorkOrder(remediator, title, scope)}>Create work order</button></div>
    </div>
    <div className="stack">
      <div className="panel"><div className="panel-head"><div><span className="eyebrow">Current</span><h2>{order ? `Work order #${order.id}` : 'No work order loaded'}</h2></div>{order && <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span>}</div>{order && <><p className="scope">{order.scope_summary}</p><div className="facts"><span>Requester<strong>{order.requester}</strong></span><span>Remediator<strong>{order.remediator}</strong></span><span>Requirements<strong>{order.requirement_count}</strong></span><span>Verified<strong>{order.verified_count}</strong></span></div></>}</div>
      {order?.status === 'DRAFT' && <div className="panel"><div className="panel-head"><div><span className="eyebrow">Atomic criterion</span><h2>Add requirement</h2></div></div><label>Label<input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Electrical enclosure"/></label><label>Acceptance criterion<textarea value={criterion} onChange={(e) => setCriterion(e.target.value)} placeholder="State one observable completion condition. Keep it atomic."/></label><label>Evidence guidance<textarea value={guidance} onChange={(e) => setGuidance(e.target.value)} placeholder="Explain what views/details should be visible in the completion proof."/></label><div className="inline"><button className="secondary" disabled={busy || !label || !criterion || !guidance} onClick={() => void addRequirement(label, criterion, guidance).then(() => { setLabel(''); setCriterion(''); setGuidance('') })}>Add requirement</button><button className="primary" disabled={busy || requirements.length === 0} onClick={() => void sealWorkOrder()}>Seal specification</button></div></div>}
      {requirements.length > 0 && <div className="panel"><div className="panel-head"><div><span className="eyebrow">Specification</span><h2>{requirements.length} frozen requirement{requirements.length === 1 ? '' : 's'}</h2></div></div><div className="requirement-list">{requirements.map((r) => <article key={r.index}><span>R{r.index + 1}</span><div><strong>{r.label}</strong><p>{r.acceptance_criterion}</p><small>{r.evidence_guidance}</small></div></article>)}</div></div>}
    </div>
  </section>
}
