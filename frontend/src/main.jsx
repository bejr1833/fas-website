import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Preserve diagnostic details without exposing them to visitors.
    console.error("FAS website rendering error:", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="appErrorFallback" role="alert" aria-live="assertive">
          <div className="appErrorFallbackCard">
            <p className="appErrorEyebrow">FAITH ALONE SAVES</p>
            <h1>We hit a temporary issue.</h1>
            <p>The page couldn't finish loading. Please try again, or return to the homepage.</p>
            <div className="appErrorActions">
              <button type="button" onClick={() => window.location.reload()}>
                Reload website
              </button>
              <a href="/">Go to homepage</a>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
