import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(_error: Error, _errorInfo: unknown) {
    // 静默处理错误
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
          <div className="max-w-lg p-6 bg-zinc-900 border border-zinc-700 rounded-lg">
            <h2 className="text-xl font-bold text-rose-400 mb-4">出错了</h2>
            <p className="text-zinc-300 mb-4">
              应用遇到了一个错误。请刷新页面重试。
            </p>
            {this.state.error && (
              <pre className="text-xs text-zinc-500 bg-zinc-950 p-3 rounded overflow-auto">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white"
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
