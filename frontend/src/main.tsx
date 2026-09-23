import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { WearlineProvider } from './context/WearlineContext'
import './styles.css'

createRoot(document.getElementById('root')!).render(<StrictMode><WearlineProvider><App /></WearlineProvider></StrictMode>)
