import React, { useState } from 'react';
import type { Informe, InformeVersion, EstadoInforme } from '@/lib/types';
import { EstadoBadge } from '@/components/common/EstadoBadge';
import { TablaDatosGrid } from './TablaDatosGrid';
import { SubirVersionModal } from './SubirVersionModal';
import { PanelRevision } from './PanelRevision';
import { HistorialEstados } from './HistorialEstados';
import {
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  Upload,
  Calendar,
  Layers,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

interface DetalleInformeViewProps {
  informeId: string;
}

export function DetalleInformeView({ informeId }: DetalleInformeViewProps) {
  const [tabActiva, setTabActiva] = useState<'grid' | 'versiones' | 'qc'>('grid');
  const [modalUploadOpen, setModalUploadOpen] = useState(false);

  // Estado del informe (reactivo)
  const [informe, setInforme] = useState<Informe>({
    id: informeId,
    proyecto_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    titulo: 'Informe Técnico de Control de Calidad Q3 2026',
    estado: 'en_revision',
    creador_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    actualizado_en: '2026-09-05T12:00:00.000Z',
    creado_en: '2026-09-05T10:00:00.000Z',
  });

  const [versiones, setVersiones] = useState<InformeVersion[]>([
    {
      id: 'c7d8e9f0-a1b2-4c3d-4e5f-6a7b8c9d0e1f',
      informe_id: informeId,
      numero_version: 1,
      archivo_key_r2: `informes/${informeId}/1725534000000_informe_q3.pdf`,
      archivo_nombre: 'informe_q3_v1.pdf',
      archivo_tamano_bytes: 2048576,
      tipo_mime: 'application/pdf',
      hash_archivo: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      resumen_cambios: 'Versión inicial con matriz fisicoquímica',
      subido_por: 'Carlos Mendoza',
      creado_en: '2026-09-05T12:30:00.000Z',
    },
  ]);

  const handleEstadoActualizado = () => {
    // Si cambia estado, refrescar o avanzar
    setInforme((prev) => ({
      ...prev,
      actualizado_en: new Date().toISOString(),
    }));
  };

  const handleVersionSubida = () => {
    const nuevaNum = versiones.length + 1;
    const nueva: InformeVersion = {
      id: `v-${Date.now()}`,
      informe_id: informeId,
      numero_version: nuevaNum,
      archivo_key_r2: `informes/${informeId}/${Date.now()}_informe_v${nuevaNum}.pdf`,
      archivo_nombre: `informe_q3_v${nuevaNum}.pdf`,
      archivo_tamano_bytes: 2450000,
      tipo_mime: 'application/pdf',
      hash_archivo: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      resumen_cambios: `Correcciones de versión ${nuevaNum}`,
      subido_por: 'Investigador',
      creado_en: new Date().toISOString(),
    };
    setVersiones([...versiones, nueva]);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-ink">
      {/* Back Link & Title Header */}
      <div className="bg-white border border-border p-4 rounded-[3px] space-y-3">
        <div className="flex items-center justify-between">
          <a
            href="/informes"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Lista de Informes</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalUploadOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-[3px] transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Subir Versión a R2</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pt-2 border-t border-border">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-semibold tracking-tight">{informe.titulo}</h1>
              <EstadoBadge estado={informe.estado} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-ink-subtle mt-1">
              <span>Expediente ID: {informe.id}</span>
              <span>·</span>
              <span>Proyecto: {informe.proyecto_id}</span>
              <span>·</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-border" />
                <span>Ingreso: {new Date(informe.creado_en).toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-ink-muted">Versión activa:</span>
            <span className="px-2 py-0.5 bg-base border border-border rounded-[3px] font-semibold">
              v{versiones[versiones.length - 1]?.numero_version || 1}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 pt-3 border-t border-border select-none">
          <button
            onClick={() => setTabActiva('grid')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-[3px] transition-colors border ${
              tabActiva === 'grid'
                ? 'bg-accent text-white border-accent font-semibold'
                : 'bg-base text-ink-muted hover:text-ink border-border'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>1. Matriz de Datos QC (Excel Grid)</span>
          </button>

          <button
            onClick={() => setTabActiva('versiones')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-[3px] transition-colors border ${
              tabActiva === 'versiones'
                ? 'bg-accent text-white border-accent font-semibold'
                : 'bg-base text-ink-muted hover:text-ink border-border'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Versiones y Archivos R2 ({versiones.length})</span>
          </button>

          <button
            onClick={() => setTabActiva('qc')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-[3px] transition-colors border ${
              tabActiva === 'qc'
                ? 'bg-accent text-white border-accent font-semibold'
                : 'bg-base text-ink-muted hover:text-ink border-border'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>3. Dictamen y Trazabilidad</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Matriz de Datos react-data-grid */}
      {tabActiva === 'grid' && (
        <TablaDatosGrid informeId={informeId} readonly={informe.estado === 'aprobado'} />
      )}

      {/* Tab 2: Versiones y Archivos R2 */}
      {tabActiva === 'versiones' && (
        <div className="bg-white border border-border p-4 rounded-[3px] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-ink">
                Historial de Versiones en Cloudflare R2
              </h3>
              <p className="text-[11px] font-mono text-ink-muted">
                Archivos PDF/DOCX protegidos con checksum SHA-256 e inmutabilidad
              </p>
            </div>
            <button
              onClick={() => setModalUploadOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border rounded-[3px] hover:bg-base font-mono"
            >
              <Upload className="w-3.5 h-3.5 text-accent" />
              <span>Cargar Nueva Versión</span>
            </button>
          </div>

          <div className="space-y-3">
            {versiones.map((v) => (
              <div
                key={v.id}
                className="p-3 border border-border rounded-[3px] bg-base flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-[2px]">
                      v{v.numero_version}
                    </span>
                    <span className="font-semibold text-ink font-sans">{v.archivo_nombre}</span>
                    <span className="text-ink-subtle font-mono text-[11px]">
                      ({(v.archivo_tamano_bytes / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <p className="text-ink-muted text-xs">{v.resumen_cambios}</p>
                  <div className="text-[10px] font-mono text-ink-subtle truncate max-w-xl">
                    <span>Key R2: {v.archivo_key_r2}</span>
                    <span className="mx-2">·</span>
                    <span>Hash: {v.hash_archivo}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-ink-subtle">
                    {new Date(v.creado_en).toLocaleDateString('es-ES')}
                  </span>
                  <a
                    href={`#`}
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`Descarga de Cloudflare R2 iniciada para: ${v.archivo_nombre}`);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white border border-border rounded-[3px] hover:bg-base text-ink font-mono"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Descargar</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Control de Calidad, Dictamen y Trazabilidad */}
      {tabActiva === 'qc' && (
        <div className="space-y-4">
          <PanelRevision
            informeId={informeId}
            estadoActual={informe.estado}
            versiones={versiones}
            onEstadoCambiado={handleEstadoActualizado}
          />
          <HistorialEstados informeId={informeId} />
        </div>
      )}

      {/* Modal Subir Versión a R2 */}
      <SubirVersionModal
        informeId={informeId}
        isOpen={modalUploadOpen}
        onClose={() => setModalUploadOpen(false)}
        onSuccess={handleVersionSubida}
      />
    </div>
  );
}
