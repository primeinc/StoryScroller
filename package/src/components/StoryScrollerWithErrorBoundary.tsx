import React from 'react'
import { StoryScroller } from './StoryScroller'
import { StoryScrollerErrorBoundary } from './StoryScrollerErrorBoundary'
import type { StoryScrollerProps } from '../types'

interface StoryScrollerWithErrorBoundaryProps extends StoryScrollerProps {
  /**
   * Fallback UI to render when an error occurs
   */
  errorFallback?: React.ReactNode
  
  /**
   * Callback when an error is caught
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * StoryScroller wrapped with an error boundary for production safety.
 * This component catches any errors that occur within the StoryScroller
 * and displays a fallback UI instead of crashing the entire app.
 */
export const StoryScrollerWithErrorBoundary: React.FC<StoryScrollerWithErrorBoundaryProps> = ({
  errorFallback,
  onError,
  ...storyScrollerProps
}) => {
  return (
    <StoryScrollerErrorBoundary fallback={errorFallback} onError={onError}>
      <StoryScroller {...storyScrollerProps} />
    </StoryScrollerErrorBoundary>
  )
}