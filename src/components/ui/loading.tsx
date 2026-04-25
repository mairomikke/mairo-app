import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const spinnerSizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
}

function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'animate-spin rounded-full border-gray-300 border-t-indigo-600',
        spinnerSizes[size],
        className
      )}
    />
  )
}

interface PageLoaderProps {
  message?: string
}

function PageLoader({ message }: PageLoaderProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        {message && <p className="text-sm text-gray-500">{message}</p>}
      </div>
    </div>
  )
}

function InlineLoader({ message }: PageLoaderProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="md" />
        {message && <p className="text-sm text-gray-500">{message}</p>}
      </div>
    </div>
  )
}

export { LoadingSpinner, PageLoader, InlineLoader }
