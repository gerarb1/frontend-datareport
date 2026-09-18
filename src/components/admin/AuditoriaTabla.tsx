import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppProviders } from '../providers/AppProviders';
import { AuthGuard } from '../auth/AuthGuard';
import type { AuditoriaResponse } from '@/lib/types';
import { ShieldCheck, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export function AuditoriaTabla() {
  const [entidad, setEntidad] = useState<string>('');
  const [offset, setOffset] = useState<number>(0);
  const limit = 20;

  const {
    data: res,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['auditoria', limit, offset, entidad],
    queryFn: () => api.metrics.auditoria({ limit, offset, entidad: entidad || undefined }),
  });

  const data: AuditoriaResponse = res?.data || {
    registros: [],
    total: 0,
    limit: 20,
    offset: 0,
  };

  const registros = data.registros || [];
  const total = data.total || 0;
  const paginasTotales = Math.ceil(total / limit) || 1;
  const paginaActual = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-ink">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-border p-3 rounded-[3px]">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-accent" />
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Registro General de Auditoría</h2>
            <p className="text-[11px] font-mono text-ink-muted">
              Trazabilidad inmutable de operaciones (GET /api/v1/metrics/auditoria → MS3)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 border border-border rounded-[3px] px-2 py-1 bg-base text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-ink-subtle" />
            <select
              value={entidad}
              onChange={(e) => {
                setEntidad(e.target.value);
                setOffset(0);
              }}
              className="bg-transparent text-ink focus:outline-none cursor-pointer"
            >
              <option value="">Todas las Entidades</option>
              <option value="informes">Informes</option>
              <option value="proyectos">Proyectos</option>
              <option value="revisiones">Revisiones</option>
              <option value="auth">Autenticación</option>
            </select>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 border border-border rounded-[3px] text-ink-muted hover:text-ink hover:bg-base transition-colors"
            title="Refrescar auditoría"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dense Audit Table */}
      <div className="bg-white border border-border rounded-[3px] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-ink-muted">
            Cargando registros de auditoría desde MS Reviews...
          </div>
        ) : isError ? (
          <div className="p-4 bg-red-50 border border-alarma/40 text-alarma text-xs rounded-[3px] font-mono">
            Error al cargar los registros de auditoría.
          </div>
        ) : registros.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-ink-muted">
            No se registraron eventos para el filtro actual.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-[#F0F2F0] text-ink font-semibold uppercase tracking-wider text-[10px] font-mono select-none">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Fecha (UTC)</th>
                  <th className="py-2.5 px-3">Acción</th>
                  <th className="py-2.5 px-3">Entidad / ID</th>
                  <th className="py-2.5 px-3">Usuario ID</th>
                  <th className="py-2.5 px-3">Metadatos del Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {registros.map((r) => (
                  <tr key={r.id} className="hover:bg-base/60 transition-colors">
                    <td className="py-2 px-3 font-semibold text-accent text-[11px]">
                      #{r.id}
                    </td>
                    <td className="py-2 px-3 text-[11px] text-ink-subtle">
                      {new Date(r.fecha).toLocaleString('es-ES')}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 bg-base border border-border rounded-[2px] font-medium text-[10px] uppercase text-ink">
                        {r.accion}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[11px]">
                      <div className="font-semibold text-ink">{r.entidad}</div>
                      <div className="text-[10px] text-ink-subtle">{r.entidad_id}</div>
                    </td>
                    <td className="py-2 px-3 text-[10px] text-ink-subtle">
                      {r.usuario_id}
                    </td>
                    <td className="py-2 px-3 max-w-xs truncate text-[10px] text-ink-muted">
                      {JSON.stringify(r.metadatos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-3 border-t border-border bg-[#F0F2F0] text-xs font-mono">
          <div className="text-ink-muted text-[11px]">
            Total de eventos: <strong>{total}</strong> · Página <strong>{paginaActual}</strong> de <strong>{paginasTotales}</strong>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="p-1 border border-border rounded-[3px] bg-white hover:bg-base disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={paginaActual >= paginasTotales}
              className="p-1 border border-border rounded-[3px] bg-white hover:bg-base disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuditoriaView() {
  return (
    <AppProviders>
      <AuthGuard allowedRoles={['superadmin']}>
        <AuditoriaTabla />
      </AuthGuard>
    </AppProviders>
  );
}
