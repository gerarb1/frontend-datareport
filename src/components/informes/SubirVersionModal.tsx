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
    if (file.type && !ALLOWED_TYPES.includes(file.type)) {
      setErrorMsg('Formato de archivo no soportado. Se aceptan archivos PDF, Word, Excel o CSV.');
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E0E3E7] rounded-2xl max-w-lg w-full p-6 space-y-5 text-[#202124] shadow-2xl animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#E0E3E7]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#202124]">Subir Nueva Versión</h3>
              <p className="text-xs text-[#5F6368]">
                Almacenamiento directo a Cloudflare R2 con checksum SHA-256
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5F6368] hover:text-[#202124] hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-[#FCE8E6] border border-[#FAD2CF] text-[#D93025] text-xs rounded-xl flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          {/* File Picker */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-[#202124]">
              Archivo del Documento (PDF, DOCX, CSV, XLSX — máx 15MB)
            </label>
            <div className="border-2 border-dashed border-[#DADCE0] hover:border-[#1A73E8] rounded-xl p-5 text-center bg-[#F8F9FA] hover:bg-[#F1F3F4] transition-colors cursor-pointer">
              <input
                type="file"
                accept=".pdf,.docx,.csv,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload-input"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                {file ? (
                  <div className="text-xs">
                    <span className="font-semibold text-[#202124]">{file.name}</span>
                    <span className="text-[#5F6368] ml-2 font-mono">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-[#1A73E8] hover:underline">Seleccionar archivo desde el equipo</span>
                    <span className="text-[11px] text-[#5F6368]">Máximo 15 MB · Formatos: PDF, DOCX, CSV, XLSX</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 text-[#202124]">
              Resumen de Modificaciones *
            </label>
            <textarea
              rows={3}
              value={resumenCambios}
              onChange={(e) => setResumenCambios(e.target.value)}
              placeholder="Ej: Corrección de mediciones de pH, integración de gráfico de turbidez y bibliografía..."
              className="w-full px-3.5 py-2.5 text-xs border border-[#DADCE0] rounded-lg bg-white text-[#202124] placeholder-[#80868B] focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition"
              required
            />
          </div>

          {/* Stepper Status */}
          {paso !== 'idle' && (
            <div className="p-3.5 bg-[#E8F0FE]/40 border border-[#D2E3FC] rounded-xl font-mono text-[11px] space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={paso === 'uploading_r2' ? 'text-[#1A73E8] font-bold' : 'text-[#5F6368]'}>
                  1. Transfiriendo archivo binario a Cloudflare R2 (PUT directo)...
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={paso === 'hashing' ? 'text-[#1A73E8] font-bold' : 'text-[#5F6368]'}>
                  2. Calculando checksum SHA-256 del archivo...
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={paso === 'registering' ? 'text-[#1A73E8] font-bold' : 'text-[#5F6368]'}>
                  3. Registrando versión en el repositorio académico...
                </span>
              </div>
              {paso === 'done' && (
                <div className="text-[#1E8E3E] font-bold flex items-center gap-1.5 pt-1 font-sans">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Versión cargada exitosamente en Cloudflare R2</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-[#E0E3E7] flex justify-end gap-2.5">
            <button
              type="button"
              disabled={paso !== 'idle'}
              onClick={onClose}
              className="px-4 py-2 border border-[#DADCE0] rounded-lg hover:bg-gray-50 text-[#5F6368] hover:text-[#202124] font-semibold text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={paso !== 'idle' || !file}
              className="px-5 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-lg font-semibold text-xs transition shadow-xs hover:shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{paso === 'idle' ? 'Iniciar Carga R2' : 'Subiendo...'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
