import { Component, ReactNode } from "react";
import { cleanupServiceWorkersAndCaches } from "@/lib/sw-cleanup";

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error);
  }

  handleReload = async () => {
    // Belt-and-suspenders: clean up any lingering SW/caches before reloading.
    await cleanupServiceWorkersAndCaches();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground p-6 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm opacity-70 max-w-md">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={this.handleReload}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
