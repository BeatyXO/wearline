import { ClipboardCheck, FileCheck2, Layers3, PlugZap } from 'lucide-react'
import type { ReactNode } from 'react'
import { HAS_CONTRACT, shortAddress } from '../lib/genlayer'
import { useWearline } from '../context/WearlineContext'

const nav = [
  ['overview', 'Overview', Layers3],
  ['work-order', 'Work order', ClipboardCheck],
  ['proof', 'Completion proof', PlugZap],
  ['report', 'Compliance report', FileCheck2],
] as const

export function AppLayout({ page, onPage, children }: { page: string; onPage: (page: string) => void; children: ReactNode }) {
  const { address, connect, busy, wrongNetwork, error, clearError } = useWearline()
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">W</span><div><strong>Wearline</strong><small>Completion proof protocol</small></div></div>
      <nav>{nav.map(([key, label, Icon]) => <button key={key} className={page === key ? 'nav active' : 'nav'} onClick={() => onPage(key)}><Icon size={17}/>{label}</button>)}</nav>
      <div className="sidebar-note"><span>Primitive</span><strong>Requirement compliance</strong><small>No escrow · no pricing · no settlement</small></div>
    </aside>
    <main className="main">
      <header className="topbar">
        <div><span className="eyebrow">GenLayer StudioNet · 61999</span><h1>Verify the work against the specification.</h1></div>
        <button className="wallet" disabled={busy} onClick={() => void connect()}>{address ? shortAddress(address) : 'Connect wallet'}</button>
      </header>
      {!HAS_CONTRACT && <div className="notice warn"><strong>Deployment required.</strong> Configure the canonical Wearline StudioNet contract before submitting writes.</div>}
      {wrongNetwork && <div className="notice warn">Your wallet is connected, but not to StudioNet 61999. Reconnect to switch networks.</div>}
      {error && <button className="notice error" onClick={clearError}>{error}</button>}
      {children}
    </main>
  </div>
}
