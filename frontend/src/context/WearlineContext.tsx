import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { connectWallet, readClient, readWearline, restoreWallet, writeWearline } from '../lib/genlayer'
import type { InjectedProvider } from '../lib/genlayer'
import type { RequirementView, WorkOrderView } from '../lib/types'

function num(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  return Number(String(value ?? 0))
}

function normalizeOrder(id: string, raw: Record<string, unknown>): WorkOrderView {
  return {
    id,
    requester: String(raw.requester ?? ''),
    remediator: String(raw.remediator ?? ''),
    title: String(raw.title ?? ''),
    scope_summary: String(raw.scope_summary ?? ''),
    status: String(raw.status ?? ''),
    result: String(raw.result ?? ''),
    requirement_count: num(raw.requirement_count),
    verified_count: num(raw.verified_count),
    created_at: String(raw.created_at ?? ''),
    sealed: Boolean(raw.sealed),
  }
}

function normalizeRequirement(index: number, raw: Record<string, unknown>): RequirementView {
  return {
    index,
    label: String(raw.label ?? ''),
    acceptance_criterion: String(raw.acceptance_criterion ?? ''),
    evidence_guidance: String(raw.evidence_guidance ?? ''),
    evidence_count: num(raw.evidence_count),
    evidence_revision: num(raw.evidence_revision),
    evidence_note: String(raw.evidence_note ?? ''),
    evidence_url_1: String(raw.evidence_url_1 ?? ''),
    evidence_sha256_1: String(raw.evidence_sha256_1 ?? ''),
    evidence_url_2: String(raw.evidence_url_2 ?? ''),
    evidence_sha256_2: String(raw.evidence_sha256_2 ?? ''),
    verdict: String(raw.verdict ?? '') as RequirementView['verdict'],
    evidence_sufficient: Boolean(raw.evidence_sufficient),
    reasoning: String(raw.reasoning ?? ''),
    verified: Boolean(raw.verified),
  }
}

type EvidenceSlot = { url: string; sha256: string }

type ContextShape = {
  address: string
  wrongNetwork: boolean
  busy: boolean
  error: string
  order: WorkOrderView | null
  requirements: RequirementView[]
  connect: () => Promise<void>
  load: (id: string) => Promise<void>
  createWorkOrder: (remediator: string, title: string, scope: string) => Promise<string>
  addRequirement: (label: string, criterion: string, guidance: string) => Promise<void>
  sealWorkOrder: () => Promise<void>
  submitEvidencePackage: (index: number, note: string, slots: EvidenceSlot[]) => Promise<void>
  verifyRequirement: (index: number) => Promise<void>
  clearError: () => void
}

const WearlineContext = createContext<ContextShape | null>(null)

export function WearlineProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState('')
  const [walletClient, setWalletClient] = useState<Awaited<ReturnType<typeof connectWallet>>['client'] | null>(null)
  const [wrongNetwork, setWrongNetwork] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<WorkOrderView | null>(null)
  const [requirements, setRequirements] = useState<RequirementView[]>([])

  useEffect(() => {
    const applyWalletState = async () => {
      const restored = await restoreWallet()
      if (!restored) {
        setAddress('')
        setWalletClient(null)
        setWrongNetwork(false)
        return
      }
      setAddress(String(restored.address))
      setWrongNetwork(Boolean(restored.wrongNetwork))
      setWalletClient(restored.client)
    }
    const handleWalletChange = () => { void applyWalletState().catch(() => {
      setWalletClient(null)
      setWrongNetwork(true)
    }) }

    applyWalletState().catch(() => undefined)
    const injected = window.ethereum as InjectedProvider | undefined
    injected?.on?.('accountsChanged', handleWalletChange)
    injected?.on?.('chainChanged', handleWalletChange)
    return () => {
      injected?.removeListener?.('accountsChanged', handleWalletChange)
      injected?.removeListener?.('chainChanged', handleWalletChange)
    }
  }, [])

  async function guard<T>(fn: () => Promise<T>) {
    setBusy(true)
    setError('')
    try { return await fn() }
    catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause)
      setError(message)
      throw cause
    } finally { setBusy(false) }
  }

  async function connect() {
    await guard(async () => {
      const next = await connectWallet()
      setAddress(next.address)
      setWalletClient(next.client)
      setWrongNetwork(false)
    })
  }

  async function load(id: string) {
    await guard(async () => {
      const client = readClient()
      const rawOrder = await readWearline(client, 'get_work_order', [id]) as Record<string, unknown>
      const nextOrder = normalizeOrder(id, rawOrder)
      const nextRequirements: RequirementView[] = []
      for (let i = 0; i < nextOrder.requirement_count; i += 1) {
        const raw = await readWearline(client, 'get_requirement', [id, i]) as Record<string, unknown>
        nextRequirements.push(normalizeRequirement(i, raw))
      }
      setOrder(nextOrder)
      setRequirements(nextRequirements)
    })
  }

  function requireWallet() {
    if (!walletClient || !address) throw new Error('Connect an injected wallet on StudioNet 61999 first.')
    return walletClient
  }

  async function createWorkOrder(remediator: string, title: string, scope: string) {
    return guard(async () => {
      const client = requireWallet()
      await writeWearline(client, 'create_work_order', [remediator, title, scope])
      const id = String(await readWearline(readClient(), 'get_latest_work_order_for_requester', [address]))
      await load(id)
      return id
    })
  }

  async function addRequirement(label: string, criterion: string, guidance: string) {
    await guard(async () => {
      if (!order) throw new Error('Load a work order first.')
      await writeWearline(requireWallet(), 'add_requirement', [order.id, label, criterion, guidance])
      await load(order.id)
    })
  }

  async function sealWorkOrder() {
    await guard(async () => {
      if (!order) throw new Error('Load a work order first.')
      await writeWearline(requireWallet(), 'seal_work_order', [order.id])
      await load(order.id)
    })
  }

  async function submitEvidencePackage(index: number, note: string, slots: EvidenceSlot[]) {
    await guard(async () => {
      if (!order) throw new Error('Load a work order first.')
      const padded = [...slots.slice(0, 2)]
      while (padded.length < 2) padded.push({ url: '', sha256: '' })
      await writeWearline(requireWallet(), 'submit_evidence_package', [
        order.id, index, note,
        padded[0].url, padded[0].sha256,
        padded[1].url, padded[1].sha256,
      ])
      await load(order.id)
    })
  }

  async function verifyRequirement(index: number) {
    await guard(async () => {
      if (!order) throw new Error('Load a work order first.')
      await writeWearline(requireWallet(), 'verify_requirement', [order.id, index])
      await load(order.id)
    })
  }

  const value = useMemo<ContextShape>(() => ({
    address, wrongNetwork, busy, error, order, requirements,
    connect, load, createWorkOrder, addRequirement, sealWorkOrder,
    submitEvidencePackage, verifyRequirement, clearError: () => setError(''),
  }), [address, wrongNetwork, busy, error, order, requirements, walletClient])

  return <WearlineContext.Provider value={value}>{children}</WearlineContext.Provider>
}

export function useWearline() {
  const value = useContext(WearlineContext)
  if (!value) throw new Error('Wearline context is unavailable.')
  return value
}
