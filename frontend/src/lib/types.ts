export type WearlineVerdict = 'SATISFIED' | 'PARTIALLY_SATISFIED' | 'NOT_SATISFIED' | 'INCONCLUSIVE'
export type WorkOrderResult = 'ACCEPTED' | 'REMEDIATION_REQUIRED' | 'REVIEW_REQUIRED' | ''

export type WorkOrderView = {
  id: string
  requester: string
  remediator: string
  title: string
  scope_summary: string
  status: 'DRAFT' | 'SEALED' | 'REVIEWING' | 'VERIFIED' | string
  result: WorkOrderResult | string
  requirement_count: number
  verified_count: number
  created_at: string
  sealed: boolean
}

export type RequirementView = {
  index: number
  label: string
  acceptance_criterion: string
  evidence_guidance: string
  evidence_count: number
  evidence_revision: number
  evidence_note: string
  evidence_url_1: string
  evidence_sha256_1: string
  evidence_url_2: string
  evidence_sha256_2: string
  verdict: WearlineVerdict | ''
  evidence_sufficient: boolean
  reasoning: string
  verified: boolean
}
