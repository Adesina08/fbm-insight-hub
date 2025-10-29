import { AlertTriangle } from "lucide-react";
import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

interface DecodedErrorInfo {
  title: string;
  description: string;
  hint?: string;
}

const REACT_ERROR_PATTERNS: Array<{
  test: (error: Error) => number | null;
  decode: (code: number) => DecodedErrorInfo | null;
}> = [
  {
    test: (error) => {
      const match = /Minified React error #(\d+)/.exec(error.message);
      return match ? Number.parseInt(match[1], 10) : null;
    },
    decode: (code) => {
      if (code === 310) {
        return {
          title: "Invalid Hook dependency list",
          description:
            "React could not initialise a Hook because the dependencies argument was not a plain array. Hooks like useMemo, useCallback and useEffect expect their second argument to be an array literal (for example, []).",
          hint:
            "Inspect recent changes to dependency lists and ensure you always pass an array instead of values such as objects, numbers or undefined. The Index page helpers are a good place to start.",
        } satisfies DecodedErrorInfo;
      }
      return null;
    },
  },
];

const decodeError = (error: Error): DecodedErrorInfo | null => {
  for (const { test, decode } of REACT_ERROR_PATTERNS) {
    const code = test(error);
    if (code != null) {
      const info = decode(code);
      if (info) {
        return info;
      }
    }
  }
  return null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render(): ReactNode {
    const { error } = this.state;
    const { children } = this.props;

    if (!error) {
      return children;
    }

    const decoded = decodeError(error);

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-center text-foreground">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold">
          {decoded?.title ?? "Something went wrong"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {decoded ? decoded.description : "An unexpected runtime error occurred while rendering the dashboard."}
        </p>
        {decoded?.hint ? (
          <p className="mt-4 max-w-2xl rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-left text-xs text-muted-foreground">
            <strong className="block text-xs font-semibold text-foreground">How to fix</strong>
            {decoded.hint}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={this.handleRetry} variant="secondary">
            Dismiss
          </Button>
          <Button onClick={this.handleReload} variant="outline">
            Reload page
          </Button>
        </div>
        <pre className="mt-8 max-w-3xl overflow-auto rounded-lg border border-border/60 bg-muted/30 p-4 text-left text-xs text-muted-foreground">
          <code>{error.message}</code>
        </pre>
      </div>
    );
  }
}

export default ErrorBoundary;
