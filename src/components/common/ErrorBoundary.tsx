// src/components/common/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; errorInfo: ErrorInfo | null; }

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null, errorInfo: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Error Fatal de React]:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 bg-[#FCE8E6] border border-[#FAD2CF] text-[#D93025] rounded-xl font-mono text-xs shadow-sm">
          <h2 className="font-bold text-sm mb-2">Fallo en el renderizado de la interfaz</h2>
          <p className="mb-4">El componente colapsó. Revisa la consola para más detalles técnicos.</p>
          <pre className="overflow-auto bg-white p-3 border border-[#FAD2CF] rounded-lg text-[#202124]">
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}