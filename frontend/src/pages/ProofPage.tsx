import { useMemo, useState } from 'react'
import { FileImage, RefreshCw } from 'lucide-react'
import { sha256File } from '../lib/hash'
import { useWearline } from '../context/WearlineContext'

type Slot = { url: string; sha256: string }

export function ProofPage() {
  const { order, requirements, busy, submitEvidencePackage, verifyRequirement } = useWearline()
  const actionable = useMemo(() => requirements.filter((r) => !r.verified), [requirements])
  const [index, setIndex] = useState(0)
  const [note, setNote] = useState('')
  const [slots, setSlots] = useState<Slot[]>([{ url: '', sha256: '' }, { url: '', sha256: '' }])
  const selected = requirements[index] ?? requirements[0]

  function update(slot: number, patch: Partial<Slot>) {
    setSlots((current) => current.map((item, i) => i === slot ? { ...item, ...patch } : item))
  }

  async function fileHash(slot: number, file?: File) {
    if (!file) return
    update(slot, { sha256: await sha256File(file) })
  }

  if (!order) return <section className="empty"><h2>Load a work order first.</h2><p>Completion proof is attached to a frozen requirement, never to an unbound image-comparison task.</p></section>

  return <section className="two-col">
    <div className="panel"><div className="panel-head"><div><span className="eyebrow">Requirement queue</span><h2>Completion proof</h2></div><span className="status">{actionable.length} open</span></div><div className="selector-list">{requirements.map((r) => <button key={r.index} className={index === r.index ? 'selector active' : 'selector'} onClick={() => setIndex(r.index)}><span>R{r.index + 1}</span><div><strong>{r.label}</strong><small>{r.verified ? r.verdict : r.evidence_count ? `Revision ${r.evidence_revision} · ${r.evidence_count} artifact(s)` : 'Awaiting proof'}</small></div></button>)}</div></div>
    <div className="stack">{selected ? <><div className="panel"><div className="panel-head"><div><span className="eyebrow">Frozen criterion</span><h2>{selected.label}</h2></div>{selected.verified && <span className="status verified">VERIFIED</span>}</div><blockquote>{selected.acceptance_criterion}</blockquote><p className="muted"><strong>Evidence guidance:</strong> {selected.evidence_guidance}</p></div>{!selected.verified && <div className="panel"><label>Evidence note<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Point reviewers to the relevant observable details. This note is treated as an untrusted claim, not proof."/></label><div className="proof-slots">{slots.map((slot, i) => <div className="proof-slot" key={i}><div><FileImage size={18}/><strong>Artifact {i + 1}{i === 0 ? ' · required' : ' · optional'}</strong></div><input value={slot.url} onChange={(e) => update(i, { url: e.target.value })} placeholder="https://…/completion-proof.png"/><input value={slot.sha256} onChange={(e) => update(i, { sha256: e.target.value })} placeholder="SHA-256"/><label className="file-chip">Compute hash from local file<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => void fileHash(i, e.target.files?.[0])}/></label></div>)}</div><div className="inline"><button className="secondary" disabled={busy || !note || !slots[0].url || !slots[0].sha256} onClick={() => selected && void submitEvidencePackage(selected.index, note, slots)}>Save / replace proof package</button><button className="primary" disabled={busy || selected.evidence_count === 0} onClick={() => selected && void verifyRequirement(selected.index)}><RefreshCw size={15}/> Run GenLayer verification</button></div></div>}</> : <div className="empty"><h2>No requirements yet.</h2></div>}</div>
  </section>
}
