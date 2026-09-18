import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppProviders } from '../providers/AppProviders';
import { AuthGuard } from '../auth/AuthGuard';
import { HistorialEstados } from './HistorialEstados';
import { PanelRevision } from './PanelRevision';
import { SubirVersionModal } from './SubirVersionModal';
import { TablaDatosGrid } from './TablaDatosGrid';
import { Upload, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { EstadoBadge } from '../common/EstadoBadge';

function DetalleInformeContent({ informeId }: { informeId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['informe', informeId],
    queryFn: async () => {
      const baseUrl = import.meta.env.PUBLIC_MS_ACADEMIC_URL;
      const token = localStorage.getItem('iasa_access_token');
      const res = await fetch(`${baseUrl}/api/v1/informes/${informeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cargar detalles del informe');
      const json = await res.json();
      return json.data || json;
    }
  });

  if (isLoading) return <div className="p-8 flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="w-4 h-4 animate-spin"/> Cargando expediente...</div>;
  if (isError || !data) return <div className="p-4 bg-alarma/10 border border-alarma text-alarma text-xs font-mono"><AlertCircle className="w-4 h-4 inline mr-2"/> {error instanceof Error ? error.message : 'Error al cargar'}</div>;

  const informe = data;
  const estadoActual = informe.estado || informe.estado_actual || 'borrador';
  const versiones = Array.isArray(informe.versiones) ? informe.versiones : [];

  return (
    <div className="space-y-6">
      {/* Cabecera del Documento */}
      <div className="flex items-center justify-between bg-white p-6 border border-border rounded-[3px]">
        <div>
          <a href="/informes" className="flex items-center gap-1 text-[11px] font-mono text-ink-subtle hover:text-ink mb-2">
            <ArrowLeft className="w-3 h-3"/> Volver a Informes
          </a>
          <h1 className="text-xl font-bold text-ink">{informe.titulo || 'Informe sin título'}</h1>
          <p className="text-xs font-mono text-ink-muted mt-1">ID: {informeId}</p>
        </div>
        <div className="text-right">
          <EstadoBadge estado={estadoActual} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal: Panel de Revisión y Datos */}
        <div className="lg:col-span-2 space-y-6">
          <PanelRevision 
            informeId={informeId} 
            estadoActual={estadoActual} 
            versiones={versiones} 
            onEstadoCambiado={refetch} 
          />

          <TablaDatosGrid 
            informeId={informeId} 
            readonly={estadoActual !== 'borrador' && estadoActual !== 'observado'} 
          />
        </div>

        {/* Columna Lateral: Versiones e Historial */}
        <div className="space-y-6">
          <div className="bg-white border border-border p-4 rounded-[3px]">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-ink">Versiones</h3>
              {(estadoActual === 'borrador' || estadoActual === 'observado' || estadoActual === 'rechazado') && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1 text-[11px] bg-base border border-border hover:border-accent px-2 py-1 rounded-[2px] font-mono transition-colors"
                >
                  <Upload className="w-3 h-3"/> Subir
                </button>
              )}
            </div>
            
            {versiones.length === 0 ? (
              <p className="text-[11px] font-mono text-ink-muted">No hay documentos subidos.</p>
            ) : (
              <div className="space-y-2">
                {versiones.map((v: any) => (
                  <div key={v.id} className="p-2 bg-base border border-border/50 rounded-[2px] text-[11px]">
                    <div className="font-semibold text-ink">v{v.numero_version} - {v.archivo_nombre}</div>
                    <div className="text-ink-subtle font-mono mt-1">{(v.archivo_tamano_bytes / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <HistorialEstados informeId={informeId} />
        </div>
      </div>

      <SubirVersionModal 
        informeId={informeId} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={refetch} 
      />
    </div>
  );
}

// Wrapper para aislamiento de contexto y lectura de URL
export function DetalleInformeWrapper() {
  const params = new URLSearchParams(window.location.search);
  const informeId = params.get('id');

  if (!informeId) {
    return (
      <div className="p-6 text-center text-alarma font-mono text-xs mt-10">
        No se especificó un ID de informe válido en la URL. Vuelve a la lista de informes.
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