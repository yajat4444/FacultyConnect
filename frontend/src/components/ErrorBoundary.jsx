import { Component } from "react";

// Catches a crash in any page so the visitor sees a message and a way back
// instead of a blank white screen.
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error(error);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section role="alert" className="mx-auto max-w-xl px-6 py-28 text-center">
        <p className="section-mark mb-3">Something went wrong</p>
        <h1 className="font-display text-3xl text-ink">This page hit a problem</h1>
        <p className="mt-3 text-sm text-ink-soft">Your work elsewhere is safe. Reloading usually fixes it.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button className="btn-primary" onClick={() => window.location.reload()}>Reload the page</button>
          <a className="btn-secondary" href="/">Go to the home page</a>
        </div>
      </section>
    );
  }
}
