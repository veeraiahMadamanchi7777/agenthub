/** Catches render errors instead of white screen. */
import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'system-ui' }}>
          <h1>Something went wrong</h1>
          <pre style={{ color: '#b91c1c', whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
