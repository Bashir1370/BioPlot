import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean; message?: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('BioPlot runtime error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return <main className="splash"><h2>BioPlot encountered an error</h2><p>{this.state.message}</p><button onClick={() => location.reload()}>Reload</button></main>
    }
    return this.props.children
  }
}
