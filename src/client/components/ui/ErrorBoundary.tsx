import React from 'react'
import { Button } from './Button'

/**
 * Error boundary for crash-prone subtrees (docs/02 §2.6: error boundaries
 * for canvas crashes). Shows a fallback with recovery instead of a blank
 * screen; resets when its children change.
 */
interface ErrorBoundaryProps {
  children: React.ReactNode
  /** Label shown in the fallback heading (e.g. "Canvas"). */
  area?: string
  onReset?: () => void
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error): void {
    // Visible in devtools/prod logs; never shown verbatim to users.
    console.error(`ErrorBoundary (${this.props.area ?? 'app'}):`, error)
  }

  private handleReset = (): void => {
    this.setState({ error: null })
    this.props.onReset?.()
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center bg-muted px-4 py-10 text-center">
          <p className="text-sm font-medium text-foreground">
            Something went wrong{this.props.area ? ` in the ${this.props.area}` : ''}
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Your project data is safe — this only affected the display. Try again, or reload the
            page if it keeps happening.
          </p>
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={this.handleReset}>
              Try again
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
