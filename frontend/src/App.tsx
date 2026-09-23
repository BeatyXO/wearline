import { useState } from 'react'
import { AppLayout } from './components/AppLayout'
import { OverviewPage } from './pages/OverviewPage'
import { WorkOrderPage } from './pages/WorkOrderPage'
import { ProofPage } from './pages/ProofPage'
import { ReportPage } from './pages/ReportPage'

export default function App() {
  const [page, setPage] = useState('overview')
  return <AppLayout page={page} onPage={setPage}>
    {page === 'overview' && <OverviewPage onStart={() => setPage('work-order')} />}
    {page === 'work-order' && <WorkOrderPage />}
    {page === 'proof' && <ProofPage />}
    {page === 'report' && <ReportPage />}
  </AppLayout>
}
