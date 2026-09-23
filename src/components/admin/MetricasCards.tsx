import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppProviders } from '../providers/AppProviders';
import { AuthGuard } from '../auth/AuthGuard';
import type { MetricasDashboard, EstadoInforme } from '@/lib/types';
import { EstadoBadge } from '@/components/common/EstadoBadge';
import { FolderKanban, FileText, CheckCircle2, RefreshCw, Clock } from 'lucide-react';

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

  const estados: EstadoInforme[] = [
    'aprobado',
    'en_revision',
    'borrador',
    'enviado',
    'observado',
    'rechazado',
  ];

  const totalInformes = data.total_informes || 0;
  const tasaAprobacion = totalInformes > 0
    ? Math.round(((data.informes_por_estado?.aprobado || 0) / totalInformes) * 100)
    : 0;

  return (
    <div className="space-y-6 text-[#202124]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E0E3E7] p-6 rounded-xl shadow-google">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#202124]">
            Telemetría y Control Estadístico
          </h1>
          <p className="text-xs text-[#5F6368] mt-1">
            Métricas agregadas del repositorio de calidad y tiempos de arbitraje (MS Reviews)
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-center px-3.5 py-2 border border-[#E0E3E7] rounded-lg text-xs font-medium text-[#202124] hover:bg-gray-50 flex items-center gap-2 transition"
          title="Refrescar métricas"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#1A73E8]' : 'text-[#5F6368]'}`} />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-[#5F6368]">
          Cargando telemetría desde MS Reviews...
        </div>
      ) : isError ? (
        <div className="p-4 bg-red-50 border border-red-200 text-[#D93025] text-xs rounded-xl">
          Error al cargar las métricas del dashboard.
        </div>
      ) : (
        <>
          {/* KPI Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E0E3E7] p-5 rounded-xl shadow-google">
              <div className="flex items-center justify-between text-xs text-[#5F6368] font-medium">
                <span>Expedientes Procesados</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A73E8] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#202124] mt-2 font-mono">
                {totalInformes}
              </div>
              <p className="text-xs text-[#5F6368] mt-1">Total acumulado en QC</p>
            </div>

            <div className="bg-white border border-[#E0E3E7] p-5 rounded-xl shadow-google">
              <div className="flex items-center justify-between text-xs text-[#5F6368] font-medium">
                <span>Proyectos Activos</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A73E8] flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#1A73E8] mt-2 font-mono">
                {data.total_proyectos_activos}
              </div>
              <p className="text-xs text-[#5F6368] mt-1">Líneas de investigación</p>
            </div>

            <div className="bg-white border border-[#E0E3E7] p-5 rounded-xl shadow-google">
              <div className="flex items-center justify-between text-xs text-[#5F6368] font-medium">
                <span>Tasa de Aprobación</span>
                <div className="w-8 h-8 rounded-lg bg-green-50 text-[#1E8E3E] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#1E8E3E] mt-2 font-mono">
                {tasaAprobacion}%
              </div>
              <p className="text-xs text-[#137333] mt-1 font-medium">Conforme a normativas analíticas</p>
            </div>

            <div className="bg-white border border-[#E0E3E7] p-5 rounded-xl shadow-google">
              <div className="flex items-center justify-between text-xs text-[#5F6368] font-medium">
                <span>Tiempo Medio Arbitraje</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#E37400] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#202124] mt-2 font-mono">
                3.4 días
              </div>
              <p className="text-xs text-[#5F6368] mt-1">Meta institucional: ≤ 4.0 días</p>
            </div>
          </div>

          {/* Breakdown by Status Grid */}
          <div className="bg-white border border-[#E0E3E7] p-6 rounded-xl shadow-google space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E3E7]">
              <h2 className="text-sm font-bold text-[#202124]">
                Distribución de Expedientes por Estado
              </h2>
              <span className="text-xs text-[#5F6368] font-mono">
                Total: {totalInformes} expedientes
              </span>
            </div>

            {/* Barra Segmentada Google Charts Style */}
            <div className="w-full h-3 rounded-full bg-[#E0E3E7] flex overflow-hidden">
              {estados.map(est => {
                const count = data.informes_por_estado?.[est] || 0;
                const pct = totalInformes > 0 ? (count / totalInformes) * 100 : 0;
                if (pct === 0) return null;

                const colorMap: Record<string, string> = {
                  aprobado: 'bg-[#1E8E3E]',
                  en_revision: 'bg-[#1A73E8]',
                  borrador: 'bg-[#5F6368]',
                  enviado: 'bg-[#4285F4]',
                  observado: 'bg-[#E37400]',
                  rechazado: 'bg-[#D93025]',
                };

                return (
                  <div
                    key={est}
                    style={{ width: `${pct}%` }}
                    className={`${colorMap[est] || 'bg-gray-400'}`}
                    title={`${est}: ${count} (${Math.round(pct)}%)`}
                  />
                );
              })}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              {estados.map((est) => {
                const count = data.informes_por_estado?.[est] || 0;
                const porcentaje = totalInformes > 0 ? Math.round((count / totalInformes) * 100) : 0;
                return (
                  <div
                    key={est}
                    className="p-4 border border-[#E0E3E7] rounded-lg bg-[#F8F9FA] flex flex-col justify-between space-y-2 hover:border-[#1A73E8]/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <EstadoBadge estado={est} showDot={true} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#202124] font-mono">{count}</div>
                      <div className="text-[11px] text-[#5F6368] font-mono mt-0.5">{porcentaje}% del total</div>
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
