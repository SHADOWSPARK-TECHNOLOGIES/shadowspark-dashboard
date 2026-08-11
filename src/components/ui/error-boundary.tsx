import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface BoundaryState {
  hasError: boolean;
}

class BoundaryImpl extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    console.error(error);
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ fallback, children }: BoundaryProps) {
  return <BoundaryImpl fallback={fallback}>{children}</BoundaryImpl>;
}

export function ErrorFallback() {
  return (
    <div className='flex min-h-[45vh] flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-10 text-center'>
      <div className='grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive'>
        <AlertCircle className='size-6' />
      </div>
      <h3 className='mt-4 text-sm font-semibold'>This page did not load</h3>
      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
        Something went wrong while loading this screen.
      </p>
      <Button className='mt-4' size='sm' onClick={() => window.location.reload()}>
        <RefreshCcw className='mr-1.5 size-3.5' />
        Retry
      </Button>
    </div>
  );
}
