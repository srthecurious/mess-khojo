import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Sentry } from '../sentry';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
    Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-brand-light-gray">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-brand-text-dark mb-2">
              Something went wrong
            </h2>
            <p className="text-brand-text-muted mb-8 text-sm">
              We encountered an unexpected error while loading this page. 
              {this.state.error && (
                <span className="block mt-2 font-mono text-xs text-red-400 bg-red-50 p-2 rounded truncate">
                  {this.state.error.message}
                </span>
              )}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-brand-primary-hover transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                className="w-full py-3 px-4 rounded-xl font-medium text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
