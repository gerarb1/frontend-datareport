import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppProviders } from '../providers/AppProviders';
import { AuthGuard } from '../auth/AuthGuard';
import { FileText, ArrowRight, AlertCircle } from 'lucide-react';
import { EstadoBadge } from '../common/EstadoBadge';

import { api } from '@/lib/api';

function InformesListaContent() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['informes'],
    queryFn: async () => {
      const res = await api.informes.listar();
      return (res as any).data || res || [];
    }
  });

  if (isLoading) return <div className="p-4 text-xs font-mono text-ink-muted">Cargando informes...</div>;

  if (isError) {
    return (
      <div className="p-4 bg-alarma/10 border border-alarma/40 text-alarma rounded-[3px] text-xs font-mono">
        <h3 className="font-bold flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Error al cargar</h3>
        <p>{error instanceof Error ? error.message : 'Fallo de conexión'}</p>
      </div>
    );
  }

  const informes = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-ink">Repositorio de Informes</h2>
          <p className="text-xs text-ink-muted font-mono">Listado general de expedientes técnicos</p>
        </div>
      </div>

      <div className="grid gap-4">
        {informes.length === 0 && (
          <div className="p-6 text-center border border-dashed border-border rounded-[3px] text-ink-subtle text-xs">
            No hay informes registrados en el sistema.
          </div>
        )}

        {informes.map((informe: any) => (
          <div key={informe.id} className="p-4 bg-white border border-border hover:border-accent transition-colors rounded-[3px] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-base rounded-[3px]">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">{informe.titulo}</h3>
                <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-ink-muted">
                  <span>ID: {informe.id.slice(0, 8)}</span>
                  <span>Proyecto: {informe.proyecto_id?.slice(0, 8) || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <EstadoBadge estado={informe.estado_actual || informe.estado || 'borrador'} />
              <a
                href={`/informes/detalle?id=${informe.id}`}
                className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                Abrir <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InformesView() {
  return (
    <AppProviders>
      <AuthGuard allowedRoles={['superadmin', 'investigador', 'revisor']}>
        <InformesListaContent />
      </AuthGuard>
    </AppProviders>
  );
}