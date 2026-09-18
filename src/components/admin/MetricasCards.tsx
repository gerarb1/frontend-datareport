import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppProviders } from '../providers/AppProviders';
import { AuthGuard } from '../auth/AuthGuard';
import type { MetricasDashboard, EstadoInforme } from '@/lib/types';
import { EstadoBadge } from '@/components/common/EstadoBadge';
import { BarChart3, FolderKanban, FileText, CheckCircle2, RefreshCw } from 'lucide-react';

export function MetricasCards() {
  const {
    data: res,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['metrics-dashboard'],
    queryFn: api.metrics.dashboard,
  });

  const data: MetricasDashboard = res?.data || {
    informes_por_estado: {},
    total_informes: 0,
    total_proyectos_activos: 0,
  };

  // Solo los 6 estados válidos del ENUM PostgreSQL
  const estados: EstadoInforme[] = [
    'borrador',
    'enviado',
    'en_revision',
    'observado',
    'aprobado',
    'rechazado',
  ];

  return (
    <div className="space-y-6 text-ink max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-border p-3 rounded-[3px]">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-accent" />
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Telemetría y Control Estadístico</h2>
            <p className="text-[11px] font-mono text-ink-muted">
              Métricas agregadas del repositorio de calidad (GET /api/v1/metrics/dashboard → MS3)
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 border border-border rounded-[3px] text-ink-muted hover:text-ink hover:bg-base transition-colors"
          title="Refrescar métricas"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs font-mono text-ink-muted">
          Cargando métricas desde MS Reviews...
        </div>
      ) : isError ? (
        <div className="p-4 bg-red-50 border border-alarma/40 text-alarma text-xs rounded-[3px] font-mono">
          Error al cargar las métricas del dashboard.
        </div>
      ) : (
        <>
          {/* KPI Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-border p-4 rounded-[3px]">
              <div className="flex items-center justify-between text-xs text-ink-muted font-mono uppercase">
                <span>Total Informes</span>
                <FileText className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-mono font-bold mt-2 text-ink">
                {data.total_informes}
              </div>
              <p className="text-[11px] text-ink-subtle mt-1 font-mono">Expedientes procesados en QC</p>
            </div>

            <div className="bg-white border border-border p-4 rounded-[3px]">
              <div className="flex items-center justify-between text-xs text-ink-muted font-mono uppercase">
                <span>Proyectos Activos</span>
                <FolderKanban className="w-4 h-4 text-accent" />
              </div>
              <div className="text-2xl font-mono font-bold mt-2 text-ink">
                {data.total_proyectos_activos}
              </div>
              <p className="text-[11px] text-ink-subtle mt-1 font-mono">Líneas de investigación en curso</p>
            </div>

            <div className="bg-white border border-border p-4 rounded-[3px]">
              <div className="flex items-center justify-between text-xs text-ink-muted font-mono uppercase">
                <span>Tasa de Aprobación</span>
                <CheckCircle2 className="w-4 h-4 text-estado-aprobado" />
              </div>
              <div className="text-2xl font-mono font-bold mt-2 text-estado-aprobado">
                {data.total_informes > 0
                  ? `${Math.round(((data.informes_por_estado.aprobado || 0) / data.total_informes) * 100)}%`
                  : '0%'}
              </div>
              <p className="text-[11px] text-ink-subtle mt-1 font-mono">Conforme a normativas analíticas</p>
            </div>
          </div>

          {/* Breakdown by Status Grid */}
          <div className="bg-white border border-border p-4 rounded-[3px] space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-ink pb-2 border-b border-border">
              Distribución de Expedientes por Estado Instrumental
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {estados.map((est) => {
                const count = data.informes_por_estado[est] || 0;
                const porcentaje = data.total_informes > 0 ? Math.round((count / data.total_informes) * 100) : 0;
                return (
                  <div
                    key={est}
                    className="p-3 border border-border rounded-[3px] bg-base flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <EstadoBadge estado={est} showDot={true} />
                    </div>
                    <div>
                      <div className="text-xl font-mono font-bold text-ink">{count}</div>
                      <div className="text-[10px] font-mono text-ink-subtle">{porcentaje}% del total</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function MetricasView() {
  return (
    <AppProviders>
      <AuthGuard allowedRoles={['revisor', 'superadmin']}>
        <MetricasCards />
      </AuthGuard>
    </AppProviders>
  );
}
