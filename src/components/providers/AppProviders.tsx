import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

// 1. Límite de Errores para atrapar la pantalla blanca
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Atrapó un error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#FCE8E6', color: '#D93025', border: '1px solid #FAD2CF', borderRadius: '12px', margin: '20px', fontFamily: 'Inter, sans-serif' }}>
          <h2 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>Error en Componente React</h2>
          <p style={{ fontWeight: '600', fontSize: '14px' }}>{this.state.error?.message}</p>
          <pre style={{ marginTop: '10px', fontSize: '12px', overflowX: 'auto', backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #FAD2CF' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// 2. Proveedor con logs de diagnóstico
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

// 3. Envoltorio (HOC)
export function withProvider<T extends Record<string, any>>(WrappedComponent: React.ComponentType<T>) {
  return function ProviderWrapper(props: T) {
    console.log(`[withProvider] Montando componente: ${WrappedComponent.displayName || WrappedComponent.name || 'Componente'}`);
    return (
      <AppProviders>
        <WrappedComponent {...props} />
      </AppProviders>
    );
  };
}