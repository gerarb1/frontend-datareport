import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Upload, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface SubirVersionModalProps {
  informeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB para informes

export function SubirVersionModal({ informeId, isOpen, onClose, onSuccess }: SubirVersionModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [resumenCambios, setResumenCambios] = useState('');
  const [paso, setPaso] = useState<'idle' | 'uploading_r2' | 'hashing' | 'registering' | 'done'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Cálculo de hash SHA-256 del archivo
  async function calcularSHA256(archivo: File): Promise<string> {
    const buffer = await archivo.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return 'sha256:' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Por favor selecciona un archivo');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setErrorMsg(`El archivo excede el límite de 15 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
      return;
    }
    if (!resumenCambios.trim()) {
      setErrorMsg('Debes ingresar un resumen de cambios de la versión');
      return;
    }

    setErrorMsg(null);

    try {
      // 1. Subida directa de binario a MS4 (R2)
      setPaso('uploading_r2');
      const mimeType = file.type || 'application/octet-stream';
      const uploadRes = await api.storage.upload({
        file,
        fileType: 'informe',
        targetId: informeId,
        filename: file.name,
        mimeType,
      });

      if (!uploadRes.success || !uploadRes.data?.file_key) {
        throw new Error(uploadRes.error || 'No se recibió file_key del microservicio de almacenamiento');
      }

      const { file_key } = uploadRes.data;

      // 2. Calcular SHA-256 en el cliente
      setPaso('hashing');
      const hash = await calcularSHA256(file);

      // 3. Registrar versión en MS2
      setPaso('registering');
      const versionRes = await api.informes.crearVersion(informeId, {
        archivo_key_r2: file_key,
        archivo_nombre: file.name,
        archivo_tamano_bytes: file.size,
        tipo_mime: mimeType,
        hash_archivo: hash,
        resumen_cambios: resumenCambios,
      });

      if (!versionRes.success) {
        throw new Error(versionRes.error || 'Error al registrar la nueva versión');
      }

      setPaso('done');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error en el proceso de carga a R2';
      setErrorMsg(message);
      setPaso('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-border rounded-[4px] max-w-lg w-full p-5 space-y-4 text-ink">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold">Subir Nueva Versión a Cloudflare R2</h3>
            <p className="text-[11px] font-mono text-ink-muted">
              Carga directa de binario vía PUT con cálculo de integridad SHA-256
            </p>
          </div>
          <button onClick={onClose} className="text-ink-subtle hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-alarma/40 text-alarma text-xs rounded-[3px] flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          {/* File Picker */}
          <div>
            <label className="block font-mono font-medium mb-1.5">
              Archivo del Documento (PDF, DOCX, CSV, XLSX — máx 15MB)
            </label>
            <div className="border border-dashed border-border rounded-[3px] p-4 text-center hover:bg-base/60 transition-colors">
              <input
                type="file"
                accept=".pdf,.docx,.csv,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload-input"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center gap-1.5">
                <Upload className="w-6 h-6 text-accent" />
                {file ? (
                  <div className="font-mono text-xs">
                    <span className="font-semibold text-ink">{file.name}</span>
                    <span className="text-ink-subtle ml-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-accent hover:underline">Seleccionar archivo desde el equipo</span>
                    <span className="text-[11px] text-ink-subtle font-mono">Límites: máx 15 MB · Formatos: .pdf, .docx, .csv, .xlsx</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block font-mono font-medium mb-1">
              Resumen de Modificaciones
            </label>
            <textarea
              rows={3}
              value={resumenCambios}
              onChange={(e) => setResumenCambios(e.target.value)}
              placeholder="Ej: Corrección de mediciones de pH, integración de gráfico de turbidez y bibliografía..."
              className="w-full px-3 py-1.5 border border-border rounded-[3px] bg-base focus:bg-white focus:outline-none focus:border-accent"
              required
            />
          </div>

          {/* Stepper Status */}
          {paso !== 'idle' && (
            <div className="p-3 bg-base border border-border rounded-[3px] font-mono text-[11px] space-y-1">
              <div className="flex items-center gap-2">
                <span className={paso === 'uploading_r2' ? 'text-accent font-semibold' : 'text-ink-subtle'}>
                  1. Transfiriendo archivo binario a Cloudflare R2 (PUT directo)...
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={paso === 'hashing' ? 'text-accent font-semibold' : 'text-ink-subtle'}>
                  2. Calculando checksum SHA-256 del archivo...
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={paso === 'registering' ? 'text-accent font-semibold' : 'text-ink-subtle'}>
                  3. Registrando versión en MS Academic...
                </span>
              </div>
              {paso === 'done' && (
                <div className="text-estado-aprobado font-semibold flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Versión cargada exitosamente en R2</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              disabled={paso !== 'idle'}
              onClick={onClose}
              className="px-3 py-1.5 border border-border rounded-[3px] hover:bg-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={paso !== 'idle' || !file}
              className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-[3px] font-medium disabled:opacity-50 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{paso === 'idle' ? 'Iniciar Carga R2' : 'Subiendo...'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
