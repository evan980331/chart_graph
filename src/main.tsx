import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary.tsx'

// 全域錯誤處理：捕捉 error boundary 無法涵蓋的執行期例外（事件處理、非同步等）
window.addEventListener('error', (event) => {
  console.error('[Global] 未捕捉的執行期錯誤：', event.error ?? event.message)
  return false
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global] 未處理的 Promise 拒絕：', event.reason)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
