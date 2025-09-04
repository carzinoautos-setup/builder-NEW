import React from "react";

interface State {
  hasError: boolean;
  error: Error | null;
  info: any;
}

export class DevErrorBoundary extends React.Component<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, info: null };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("DevErrorBoundary caught:", error, info);
    this.setState({ hasError: true, error, info });
  }

  render() {
    if (!this.state.hasError) return this.props.children as any;

    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
        <div className="max-w-3xl w-full bg-white border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Runtime Error</h2>
          <p className="text-sm text-red-700 mb-4">An error occurred while rendering the application. See details below.</p>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">{this.state.error?.message}</pre>
          {this.state.info && (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-gray-700">Component stack</summary>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">{this.state.info.componentStack}</pre>
            </details>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-2 bg-red-600 text-white rounded"
            >
              Reload
            </button>
            <button
              onClick={() => {
                const payload = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.error?.stack}\n\nInfo:${JSON.stringify(this.state.info)}`;
                navigator.clipboard?.writeText(payload);
                alert("Error copied to clipboard");
              }}
              className="px-3 py-2 bg-gray-200 rounded"
            >
              Copy Error
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default DevErrorBoundary;
