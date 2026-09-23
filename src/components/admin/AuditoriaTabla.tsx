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
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E0E3E7] p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink tracking-tight">Registro General de Auditoría</h2>
            <p className="text-xs text-ink-muted">
              Trazabilidad inmutable de operaciones del sistema (GET /api/v1/metrics/auditoria)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-[#DADCE0] rounded-lg px-3 py-1.5 bg-white text-xs">
            <Filter className="w-4 h-4 text-ink-muted" />
            <select
              value={entidad}
              onChange={(e) => {
                setEntidad(e.target.value);
                setOffset(0);
              }}
              className="bg-transparent text-ink font-medium focus:outline-none cursor-pointer text-xs"
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
            className="p-2 border border-[#DADCE0] rounded-lg text-[#5F6368] hover:text-[#202124] hover:bg-[#F8F9FA] transition-colors"
            title="Refrescar auditoría"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#1A73E8]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Google Cloud Logging Data Table */}
      <div className="bg-white border border-[#E0E3E7] rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-[#5F6368]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#1A73E8] mb-2" />
            Cargando registros de auditoría desde el microservicio...
          </div>
        ) : isError ? (
          <div className="p-4 m-4 bg-[#FCE8E6] border border-[#FAD2CF] text-[#D93025] text-xs rounded-lg font-mono">
            Error al cargar los registros de auditoría.
          </div>
        ) : registros.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#5F6368]">
            No se registraron eventos para el filtro actual.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E0E3E7] bg-[#F8F9FA] text-[#5F6368] font-semibold uppercase tracking-wider text-[11px] select-none">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Fecha (UTC)</th>
                  <th className="py-3 px-4">Acción</th>
                  <th className="py-3 px-4">Entidad / ID</th>
                  <th className="py-3 px-4">Usuario ID</th>
                  <th className="py-3 px-4">Metadatos del Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E3E7] text-xs">
                {registros.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-[#1A73E8] text-[11px]">
                      #{r.id}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#5F6368]">
                      {new Date(r.fecha).toLocaleString('es-ES')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-[#E8F0FE] text-[#1A73E8] rounded-full font-medium text-[11px] uppercase tracking-wide">
                        {r.accion}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink">{r.entidad}</div>
                      <div className="text-[11px] font-mono text-ink-muted">{r.entidad_id}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-ink-muted">
                      {r.usuario_id}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate font-mono text-[11px] text-ink-muted">
                      {JSON.stringify(r.metadatos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#E0E3E7] bg-[#F8F9FA] text-xs">
          <div className="text-ink-muted text-xs">
            Total de eventos: <strong className="text-ink">{total}</strong> · Página <strong className="text-ink">{paginaActual}</strong> de <strong className="text-ink">{paginasTotales}</strong>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="p-1.5 border border-[#DADCE0] rounded-lg bg-white text-ink-muted hover:text-ink hover:bg-[#F8F9FA] disabled:opacity-40 disabled:hover:bg-white transition-colors"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={paginaActual >= paginasTotales}
              className="p-1.5 border border-[#DADCE0] rounded-lg bg-white text-ink-muted hover:text-ink hover:bg-[#F8F9FA] disabled:opacity-40 disabled:hover:bg-white transition-colors"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
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
