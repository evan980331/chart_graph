import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  message: string
  stack?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    // 在 console 輸出詳細錯誤資訊，便於排查
    console.error('[ErrorBoundary] 攔截到未處理的 JavaScript 例外：', error)
    console.error('[ErrorBoundary] 元件階層：', info.componentStack)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
        <div className="w-full max-w-lg rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <h1 className="text-lg font-semibold">應用程式發生錯誤</h1>
          </div>
          <p className="mt-2 text-sm text-neutral-600">
            程式在執行階段發生未預期的錯誤，詳細資訊已輸出至瀏覽器 Console。
          </p>
          <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-neutral-50 p-3 text-xs text-red-800 ring-1 ring-inset ring-neutral-200">
            {this.state.message || '未知錯誤'}
          </pre>
          {this.state.stack && (
            <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-neutral-50 p-3 text-[11px] text-neutral-500 ring-1 ring-inset ring-neutral-200">
              {this.state.stack}
            </pre>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            <RotateCcw className="h-4 w-4" />
            重新載入頁面
          </button>
        </div>
      </div>
    )
  }
}
