import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppProviders } from '../providers/AppProviders';
import { AuthGuard } from '../auth/AuthGuard';
import { HistorialEstados } from './HistorialEstados';
import { PanelRevision } from './PanelRevision';
import { SubirVersionModal } from './SubirVersionModal';
import { TablaDatosGrid } from './TablaDatosGrid';
import { 
  ArrowLeft, Loader2, AlertCircle, Upload, 
  Info, Table, ShieldCheck, Clock, FileSpreadsheet
} from 'lucide-react';
import { EstadoBadge } from '../common/EstadoBadge';
import { api } from '@/lib/api';

function DetalleInformeContent({ informeId }: { informeId: string }) {
  const [activeTab, setActiveTab] = useState<'resumen' | 'datos' | 'revision' | 'historial'>('resumen');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['informe', informeId],
    queryFn: async () => {
      const res = await api.informes.obtener(informeId);
      return (res as any).data || res;
    }
  });

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center gap-2 text-xs text-[#5F6368]">
        <Loader2 className="w-4 h-4 animate-spin text-[#1A73E8]" />
        <span>Cargando expediente técnico...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-[#D93025] rounded-xl text-xs">
        <div className="flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4" />
          <span>Error al cargar expediente</span>
        </div>
        <p className="mt-1">{error instanceof Error ? error.message : 'Error desconocido'}</p>
        <a href="/informes" className="inline-block mt-3 text-xs underline font-semibold">
          Volver al repositorio
        </a>
      </div>
    );
  }

  const informe = data;
  const estadoActual = informe.estado || informe.estado_actual || 'borrador';
  const versiones = Array.isArray(informe.versiones) ? informe.versiones : [];

  const tabs = [
    { id: 'resumen', label: 'Resumen General', icon: Info },
    { id: 'datos', label: 'Datos Científicos & Grilla QC', icon: Table },
    { id: 'revision', label: 'Consola de Dictamen & Revisión', icon: ShieldCheck },
    { id: 'historial', label: 'Historial de Estados', icon: Clock },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Encabezado del Expediente estilo Google Document */}
      <div className="bg-white border border-[#E0E3E7] rounded-xl p-6 shadow-google">
        <div className="flex items-center justify-between pb-4 border-b border-[#E0E3E7]">
          <a
            href="/informes"
            className="flex items-center gap-1.5 text-xs text-[#1A73E8] hover:underline font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Informes
          </a>
          <div className="flex items-center gap-3">
            <EstadoBadge estado={estadoActual} />
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs text-[#5F6368] font-mono">
            EXP-ID: {informeId} {informe.proyecto_id ? `· Proyecto: ${informe.proyecto_id}` : ''}
          </div>
          <h1 className="text-2xl font-bold text-[#202124] mt-1 tracking-tight">
            {informe.titulo || 'Informe sin título'}
          </h1>
        </div>
      </div>

      {/* Pestañas de Navegación Google Workspace */}
      <div className="border-b border-[#E0E3E7] flex items-center gap-6 overflow-x-auto select-none font-medium text-sm">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 flex items-center gap-2 border-b-2 font-medium transition whitespace-nowrap ${
                isActive
                  ? 'border-[#1A73E8] text-[#1A73E8] font-semibold'
                  : 'border-transparent text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ──────────────────────────────────────────────────────────
           CONTENIDO PESTAÑA 1: RESUMEN GENERAL (INICIAL)
      ────────────────────────────────────────────────────────── */}
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[#E0E3E7] rounded-xl p-6 shadow-google space-y-5">
            <div>
              <h3 className="text-base font-bold text-ink">Ficha Técnica del Expediente</h3>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                {informe.descripcion || 'Sin descripción técnica adicional registrada.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E0E3E7] text-xs">
              <div>
                <span className="text-ink-muted">Identificador Unívoco:</span>
                <div className="font-mono text-ink mt-0.5">{informeId}</div>
              </div>
              <div>
                <span className="text-ink-muted">Estado Actual de Flujo:</span>
                <div className="mt-1">
                  <EstadoBadge estado={estadoActual} />
                </div>
              </div>
              <div>
                <span className="text-ink-muted">Proyecto Asociado:</span>
                <div className="font-semibold text-[#1A73E8] mt-0.5">
                  {informe.proyecto_id || 'Investigación General'}
                </div>
              </div>
              <div>
                <span className="text-ink-muted">Versiones Registradas:</span>
                <div className="font-mono text-ink mt-0.5">
                  {versiones.length} {versiones.length === 1 ? 'versión' : 'versiones'}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E0E3E7] flex items-center justify-between">
              <span className="text-xs text-ink-muted">¿Deseas editar datos o emitir revisión?</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('datos')}
                  className="px-3 py-1.5 rounded-lg border border-[#E0E3E7] hover:bg-gray-50 text-xs font-semibold text-[#1A73E8] transition"
                >
                  Ir a Grilla Científica →
                </button>
                <button
                  onClick={() => setActiveTab('revision')}
                  className="px-3 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-[#1557B0] text-xs font-semibold text-white transition shadow-xs"
                >
                  Ir a Dictamen →
                </button>
              </div>
            </div>
          </div>

          {/* Versiones de Archivos en Cloudflare R2 */}
          <div className="bg-white border border-[#E0E3E7] rounded-xl p-5 shadow-google space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E3E7]">
              <div>
                <h3 className="text-xs font-bold text-[#202124] uppercase tracking-wider">
                  Datasets en R2
                </h3>
                <p className="text-[11px] text-[#5F6368]">Archivos preservados</p>
              </div>
              {(estadoActual === 'borrador' || estadoActual === 'observado' || estadoActual === 'rechazado') && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-[#E8F0FE] text-[#1A73E8] font-semibold hover:bg-blue-100 transition flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" /> Subir
                </button>
              )}
            </div>

            {versiones.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#5F6368]">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-[#BDC1C6] mb-2" />
                No hay archivos adjuntos en el expediente.
              </div>
            ) : (
              <div className="space-y-2">
                {versiones.map((v: any) => (
                  <div
                    key={v.id}
                    className="p-3 bg-[#F8F9FA] border border-[#E0E3E7] rounded-lg text-xs hover:border-[#1A73E8]/40 transition"
                  >
                    <div className="font-semibold text-[#202124] truncate">{v.archivo_nombre}</div>
                    <div className="text-[#5F6368] font-mono text-[11px] mt-1 flex items-center justify-between">
                      <span>Versión {v.numero_version}</span>
                      <span>{(v.archivo_tamano_bytes / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
           CONTENIDO PESTAÑA 2: DATOS CIENTÍFICOS & GRILLA QC
      ────────────────────────────────────────────────────────── */}
      {activeTab === 'datos' && (
        <div className="space-y-4">
          <TablaDatosGrid 
            informeId={informeId} 
            readonly={estadoActual !== 'borrador' && estadoActual !== 'observado'} 
          />
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
           CONTENIDO PESTAÑA 3: CONSOLA DE DICTAMEN & REVISIÓN
      ────────────────────────────────────────────────────────── */}
      {activeTab === 'revision' && (
        <div className="space-y-4">
          <PanelRevision 
            informeId={informeId} 
            estadoActual={estadoActual} 
            versiones={versiones} 
            onEstadoCambiado={refetch} 
          />
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
           CONTENIDO PESTAÑA 4: HISTORIAL DE ESTADOS
      ────────────────────────────────────────────────────────── */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          <HistorialEstados informeId={informeId} />
        </div>
      )}

      <SubirVersionModal 
        informeId={informeId} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={refetch} 
      />
    </div>
  );
}

export function DetalleInformeWrapper() {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const informeId = params.get('id');

  if (!informeId) {
    return (
      <div className="p-8 text-center text-[#D93025] text-xs font-mono">
        No se especificó un ID de informe válido en la URL.
        <a href="/informes" className="block mt-2 underline">Volver al repositorio</a>
      </div>
    );
  }

  return (
    <AppProviders>
      <AuthGuard allowedRoles={['superadmin', 'investigador', 'revisor']}>
        <DetalleInformeContent informeId={informeId} />
      </AuthGuard>
    </AppProviders>
  );
}
