// src/components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null; }

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null, errorInfo: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🔴 [Error Fatal de React]:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 bg-alarma/10 border border-alarma text-alarma rounded-[3px] font-mono text-xs">
          <h2 className="font-bold text-sm mb-2">Fallo crítico en el renderizado</h2>
          <p className="mb-4">El componente colapsó. Revisa la consola (F12) para más detalles.</p>
          <pre className="overflow-auto bg-white p-2 border border-border">
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}