import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SmartCold Uncaught Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Something went wrong</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                An unexpected interface error occurred. You can refresh the page or return to the dashboard.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-700/50 text-[11px] font-mono text-rose-300 text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center justify-center space-x-3 pt-2">
              <Button
                variant="primary"
                onClick={this.handleReload}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Reload Application
              </Button>
              <Button
                variant="outline"
                onClick={this.handleHome}
                className="border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                <Home className="w-4 h-4 mr-1.5" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
