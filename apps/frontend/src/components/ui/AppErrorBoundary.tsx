import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Relay] UI error boundary', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-full items-center justify-center bg-bg px-6">
          <div className="surface w-full max-w-[420px] p-6 text-center">
            <p className="text-2xs font-semibold uppercase tracking-[0.22em] text-text-muted">
              Relay Recovery
            </p>
            <h1 className="mt-3 text-xl font-semibold text-text-primary">
              Something went wrong in the client
            </h1>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              The interface hit an unexpected state. Reloading the app should bring everything
              back safely.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="btn-primary mt-5 w-full"
            >
              Reload Relay
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
