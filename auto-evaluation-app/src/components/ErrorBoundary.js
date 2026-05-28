import React from 'react';

class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] caught:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold mb-2">Quelque chose s'est mal passé</h1>
          <p className="text-sm text-gray-600 mb-4">
            L'application a rencontré une erreur inattendue. Recharger la page
            devrait régler le problème.
          </p>
          <pre className="text-xs bg-gray-50 border rounded p-2 mb-4 overflow-auto max-h-40">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={this.handleReload}
            className="w-full rounded-md bg-black text-white py-2 text-sm font-medium hover:bg-gray-800"
          >
            Recharger l'application
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
