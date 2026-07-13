import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error) => void
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Geo Gallery render error:', error, info.componentStack)
    this.props.onError?.(error)
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="error-fallback">
          <h2>Что-то пошло не так</h2>
          <p>Попробуйте обновить страницу.</p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Обновить
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
