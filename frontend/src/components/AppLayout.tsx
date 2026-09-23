import { Check, ClipboardCheck, Copy, FileCheck2, Layers3, LogOut, PlugZap, RefreshCw } from 'lucide-react'
import { useState } from 'react'
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
  const { address, connect, switchNetwork, disconnect, busy, wrongNetwork, error, clearError } = useWearline()
  const [walletOpen, setWalletOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copyAddress() {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  async function disconnectAndClose() {
    await disconnect()
    setWalletOpen(false)
    setCopied(false)
  }

  return <div className="shell">
    <aside className="sidebar">
      <button type="button" className="brand brand-button" onClick={() => onPage('overview')} aria-label="Open Wearline overview"><span className="brand-mark">W</span><div><strong>Wearline</strong><small>Completion proof protocol</small></div></button>
      <nav>{nav.map(([key, label, Icon]) => <button key={key} className={page === key ? 'nav active' : 'nav'} onClick={() => onPage(key)}><Icon size={17}/>{label}</button>)}</nav>
      <div className="sidebar-note"><span>Primitive</span><strong>Requirement compliance</strong><small>No escrow · no pricing · no settlement</small></div>
    </aside>
    <main className="main">
      <header className="topbar">
        <div><span className="eyebrow">GenLayer StudioNet · 61999</span><h1>Verify the work against the specification.</h1></div>
        <div className="wallet-wrap">
          <button
            className="wallet"
            disabled={busy}
            onClick={() => address ? setWalletOpen((open) => !open) : void connect()}
            aria-expanded={address ? walletOpen : undefined}
          >
            {address ? shortAddress(address) : 'Connect wallet'}
          </button>
          {address && walletOpen && <div className="wallet-menu">
            <span className="wallet-menu-label">Connected wallet</span>
            <strong className="wallet-full-address">{address}</strong>
            <button className="wallet-menu-action" onClick={() => void copyAddress()}>
              {copied ? <Check size={15}/> : <Copy size={15}/>}
              {copied ? 'Copied' : 'Copy address'}
            </button>
            <button className="wallet-menu-action danger" disabled={busy} onClick={() => void disconnectAndClose()}>
              <LogOut size={15}/>Disconnect
            </button>
          </div>}
        </div>
      </header>
      {!HAS_CONTRACT && <div className="notice warn"><strong>Deployment required.</strong> Configure the canonical Wearline StudioNet contract before submitting writes.</div>}
      {wrongNetwork && <div className="notice warn network-notice">
        <span>Your wallet is connected, but not to StudioNet 61999.</span>
        <button className="notice-action" disabled={busy} onClick={() => void switchNetwork()}><RefreshCw size={14}/>{busy ? 'Switching…' : 'Switch to StudioNet'}</button>
      </div>}
      {error && <button className="notice error" onClick={clearError}>{error}</button>}
      {children}
    </main>
  </div>
}
