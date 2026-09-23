import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'

export const CONTRACT_ADDRESS = import.meta.env.VITE_WEARLINE_CONTRACT_ADDRESS?.trim() as `0x${string}` | undefined
export const HAS_CONTRACT = Boolean(CONTRACT_ADDRESS)
export const STUDIONET_CHAIN_ID = '0xf22f'
export const STUDIONET_DECIMAL_CHAIN_ID = 61999
const WALLET_DISCONNECTED_KEY = 'wearline.wallet.disconnected'

export type InjectedProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (name: string, callback: (value: unknown) => void) => void
  removeListener?: (name: string, callback: (value: unknown) => void) => void
}

function provider(): InjectedProvider {
  if (!window.ethereum) throw new Error('No injected wallet detected.')
  return window.ethereum as InjectedProvider
}

export function readClient() {
  return createClient({ chain: studionet })
}

export function assertStudioNet(chainId: unknown) {
  const numeric = typeof chainId === 'string'
    ? Number.parseInt(chainId, chainId.startsWith('0x') ? 16 : 10)
    : Number(chainId)
  if (numeric !== STUDIONET_DECIMAL_CHAIN_ID) throw new Error('GenLayer StudioNet (chain ID 61999) is required.')
}

function errorCode(error: unknown) {
  if (typeof error === 'object' && error && 'code' in error) return Number((error as { code?: unknown }).code)
  return undefined
}

export function errorMessage(error: unknown, depth = 0): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error.trim()) return error
  if (typeof error === 'number' || typeof error === 'boolean') return String(error)
  if (!error || typeof error !== 'object') return 'Unexpected wallet or network error.'

  const record = error as Record<string, unknown>
  for (const key of ['shortMessage', 'reason', 'message']) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value
  }

  if (depth < 2) {
    for (const key of ['error', 'cause', 'data']) {
      if (record[key] !== undefined && record[key] !== error) {
        const nested = errorMessage(record[key], depth + 1)
        if (nested !== 'Unexpected wallet or network error.') return nested
      }
    }
  }

  try {
    const serialized = JSON.stringify(error)
    if (serialized && serialized !== '{}') return serialized
  } catch {
    // Fall through to a stable user-facing message.
  }
  return 'Unexpected wallet or network error.'
}

export async function switchToStudioNet() {
  const injected = provider()
  try {
    await injected.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: STUDIONET_CHAIN_ID }] })
  } catch (error) {
    const unknown = errorCode(error) === 4902 || /unknown chain|unrecognized chain|not added/i.test(errorMessage(error))
    if (!unknown) throw error
    await injected.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: STUDIONET_CHAIN_ID,
        chainName: 'GenLayer StudioNet',
        rpcUrls: ['https://studio.genlayer.com/api'],
        nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
        blockExplorerUrls: ['https://explorer-studio.genlayer.com/'],
      }],
    })
    await injected.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: STUDIONET_CHAIN_ID }] })
  }
}

export async function disconnectInjectedWallet() {
  window.localStorage.setItem(WALLET_DISCONNECTED_KEY, '1')
  if (!window.ethereum) return
  const injected = provider()
  try {
    await injected.request({
      method: 'wallet_revokePermissions',
      params: [{ eth_accounts: {} }],
    })
  } catch {
    // Not every injected wallet implements permission revocation.
    // The app still clears its local session below.
  }
}

export function walletClientForAccount(address: string) {
  return createClient({
    chain: studionet,
    account: address as `0x${string}`,
    provider: window.ethereum as never,
  })
}

export async function connectWallet() {
  window.localStorage.removeItem(WALLET_DISCONNECTED_KEY)
  const injected = provider()
  const accounts = (await injected.request({ method: 'eth_requestAccounts' })) as string[]
  if (!accounts?.[0]) throw new Error('Wallet returned no account.')
  const chainId = await injected.request({ method: 'eth_chainId' })
  if (String(chainId).toLowerCase() !== STUDIONET_CHAIN_ID) await switchToStudioNet()
  assertStudioNet(await injected.request({ method: 'eth_chainId' }))
  return { address: accounts[0] as `0x${string}`, client: await walletClientForAccount(accounts[0]) }
}

export async function restoreWallet() {
  if (window.localStorage.getItem(WALLET_DISCONNECTED_KEY) === '1') return null
  if (!window.ethereum) return null
  const injected = provider()
  const accounts = (await injected.request({ method: 'eth_accounts' })) as string[]
  if (!accounts?.[0]) return null
  const chainId = await injected.request({ method: 'eth_chainId' })
  if (String(chainId).toLowerCase() !== STUDIONET_CHAIN_ID) return { address: accounts[0], client: null, wrongNetwork: true }
  return { address: accounts[0], client: await walletClientForAccount(accounts[0]), wrongNetwork: false }
}

export async function writeWearline(client: ReturnType<typeof createClient>, functionName: string, args: unknown[]) {
  if (!CONTRACT_ADDRESS) throw new Error('The canonical Wearline StudioNet deployment is not configured.')
  const txHash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args: args as never[],
    value: 0n,
  }) as string
  await waitForWearlineTransaction(client, txHash)
  return txHash
}

export async function readWearline(client: ReturnType<typeof createClient>, functionName: string, args: unknown[] = []) {
  if (!CONTRACT_ADDRESS) throw new Error('The canonical Wearline StudioNet deployment is not configured.')
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args: args as never[],
    jsonSafeReturn: true,
  })
}

export async function waitForWearlineTransaction(client: ReturnType<typeof createClient>, txHash: string) {
  const tx = await client.waitForTransactionReceipt({
    hash: txHash as never,
    status: TransactionStatus.FINALIZED as never,
    interval: 5_000,
    retries: 100,
  })
  const receipt = tx as {
    statusName?: string
    status_name?: string
    resultName?: string
    result_name?: string
    txExecutionResultName?: string
    tx_execution_result_name?: string
    consensus_data?: { leader_receipt?: Array<{ mode?: string; execution_result?: string }> }
  }
  const status = receipt.status_name ?? receipt.statusName
  const result = receipt.result_name ?? receipt.resultName
  const leaderResult = receipt.consensus_data?.leader_receipt?.find((entry) => entry.mode === 'leader')?.execution_result
  const execution = receipt.tx_execution_result_name ?? receipt.txExecutionResultName ?? leaderResult
  if (status !== 'FINALIZED') throw new Error(`Transaction ${txHash} did not reach finality.`)
  if (result === 'FAILURE' || execution === 'ERROR' || execution === 'FINISHED_WITH_ERROR') throw new Error(`Transaction ${txHash} failed during execution.`)
  if (execution !== 'SUCCESS' && execution !== 'FINISHED_WITH_RETURN') throw new Error(`Transaction ${txHash} finalized without successful execution.`)
  return tx
}

export function shortAddress(value?: string) {
  if (!value) return 'Not connected'
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}
