import { Component, ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary for StoryScroller component.
 * Catches errors during rendering and provides a fallback UI.
 */
export class StoryScrollerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.error('StoryScroller Error:', error, errorInfo)
    }
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI if provided, otherwise render a default error message
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f8f8f8',
          color: '#333'
        }}>
          <div>
            <h2>Something went wrong</h2>
            <p>The story scroller encountered an error.</p>
            {(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && this.state.error && (
              <details style={{ marginTop: '20px', textAlign: 'left' }}>
                <summary>Error Details</summary>
                <pre style={{ 
                  padding: '10px', 
                  backgroundColor: '#eee',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxWidth: '600px'
                }}>
                  {this.state.error.message || this.state.error.toString() || 'An unknown error occurred'}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}