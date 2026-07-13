import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error) => void
}

interface State {
  error: Error | null
}

function clearAppStorage() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('geo-gallery-store')) {
        localStorage.removeItem(key)
      }
    }
  } catch {
    // ignore storage errors
  }
  window.location.reload()
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
          <p>Попробуйте обновить страницу. Если не помогло — сбросьте сохранённые данные сайта.</p>
          <div className="error-fallback__actions">
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Обновить
            </button>
            <button type="button" className="btn btn-secondary" onClick={clearAppStorage}>
              Сбросить данные
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
