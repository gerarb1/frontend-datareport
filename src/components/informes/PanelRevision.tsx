import React, { useState, useCallback } from 'react';
import { api, getStoredUser } from '@/lib/api';
import type { EstadoInforme, ResultadoRevision, InformeVersion } from '@/lib/types';
import type { LanguageToolMatch } from '@/lib/types';
import { ShieldCheck, AlertCircle, CheckCircle, Send, Plus, Trash2, ArrowRight, FileSearch, Loader2, Pencil, AlertTriangle } from 'lucide-react';

interface PanelRevisionProps {
  informeId: string;
  estadoActual: EstadoInforme;
  versiones: InformeVersion[];
  onEstadoCambiado: () => void;
}

export function PanelRevision({
  informeId,
  estadoActual,
  versiones,
  onEstadoCambiado,
}: PanelRevisionProps) {
  const user = getStoredUser();
  const esRevisor = user?.rol === 'revisor' || user?.rol === 'superadmin';

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Formulario de dictamen (para revisor)
  const [resultado, setResultado] = useState<ResultadoRevision>('observado');
  const [dictamen, setDictamen] = useState('');
  const [observaciones, setObservaciones] = useState<string[]>(['']);
  const [versionSeleccionada, setVersionSeleccionada] = useState<string>(
    versiones[versiones.length - 1]?.id || ''
  );

  // Document Viewer / LanguageTool
  const [docContent, setDocContent] = useState<string | null>(null);
  const [docHtml, setDocHtml] = useState<string | null>(null);
  const [ltMatches, setLtMatches] = useState<LanguageToolMatch[]>([]);
  const [ltLoading, setLtLoading] = useState(false);
  const [docLoading, setDocLoading] = useState(false);

  const agregarObservacion = () => {
    setObservaciones([...observaciones, '']);
  };

  const quitarObservacion = (index: number) => {
    setObservaciones(observaciones.filter((_, i) => i !== index));
  };

  const actualizarObservacion = (index: number, valor: string) => {
    const copia = [...observaciones];
    copia[index] = valor;
    setObservaciones(copia);
  };

  /**
   * Transiciones válidas según la máquina de estados PostgreSQL:
   *  borrador → enviado
   *  enviado → en_revision
   *  en_revision → observado | aprobado | rechazado (vía revisiones)
   *  observado → borrador
   *  rechazado → borrador
   */
  const ejecutarTransicion = async (nuevoEstado: EstadoInforme, comentario = '') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await api.informes.transicion(informeId, {
        nuevo_estado: nuevoEstado,
        comentario: comentario || `Transición a ${nuevoEstado}`,
      });
      if (res.success) {
        setSuccessMsg(`Estado actualizado a: ${nuevoEstado.replace('_', ' ')}`);
        onEstadoCambiado();
      } else {
        setErrorMsg(res.error || 'No se pudo actualizar el estado');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al ejecutar transición';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar y parsear el documento de la versión seleccionada
  const cargarDocumento = useCallback(async () => {
    const version = versiones.find((v) => v.id === versionSeleccionada);
    if (!version) return;

    setDocLoading(true);
    setDocContent(null);
    setDocHtml(null);
    setLtMatches([]);

    try {
      // Descargar archivo de R2
      const fileUrl = api.storage.getFileUrl(version.archivo_key_r2);
      const res = await fetch(fileUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('iasa_access_token') || ''}`,
        },
      });
      if (!res.ok) throw new Error(`Error al descargar archivo: ${res.status}`);

      const blob = await res.blob();
      const file = new File([blob], version.archivo_nombre, { type: version.tipo_mime });

      // Parsear según tipo
      const { parseDocument } = await import('@/lib/documentParser');
      const result = await parseDocument(file);

      setDocContent(result.text);
      if (result.html) setDocHtml(result.html);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al parsear documento';
      setErrorMsg(message);
    } finally {
      setDocLoading(false);
    }
  }, [versionSeleccionada, versiones]);

  // Verificar ortografía con LanguageTool
  const verificarOrtografia = useCallback(async () => {
    if (!docContent) return;

    setLtLoading(true);
    try {
      const { checkText } = await import('@/lib/languagetool');
      const result = await checkText(docContent, 'es');
      setLtMatches(result.matches);
      if (result.matches.length === 0) {
        setSuccessMsg('No se encontraron errores ortográficos ni gramaticales.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al verificar ortografía';
      setErrorMsg(message);
    } finally {
      setLtLoading(false);
    }
  }, [docContent]);

  // Emisión formal de dictamen de revisión (POST /api/v1/revisiones en MS3)
  const emitirRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionSeleccionada) {
      setErrorMsg('Debes seleccionar la versión evaluada');
      return;
    }
    if (!dictamen.trim()) {
      setErrorMsg('El dictamen técnico general es obligatorio');
      return;
    }

    const obsFiltradas = observaciones.filter((o) => o.trim().length > 0);

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.revisiones.crear({
        informe_id: informeId,
        informe_version_id: versionSeleccionada,
        resultado,
        dictamen_general: dictamen,
        observaciones: obsFiltradas,
      });

      if (res.success) {
        setSuccessMsg(`Dictamen emitido con éxito: ${resultado.toUpperCase()}`);
        setDictamen('');
        setObservaciones(['']);
        onEstadoCambiado();
      } else {
        setErrorMsg(res.error || 'Error al guardar la revisión');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error en la petición de revisión';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 text-ink">
      {errorMsg && (
        <div className="p-4 bg-[#FCE8E6] border border-[#FAD2CF] text-[#D93025] text-xs rounded-xl flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-[#E6F4EA] border border-[#CEEAD6] text-[#137333] text-xs rounded-xl flex items-center gap-2 font-sans font-medium">
          <CheckCircle className="w-4 h-4 shrink-0 text-[#1E8E3E]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Flujo de Estados Operativos — sólo transiciones válidas */}
      <div className="bg-white border border-[#E0E3E7] p-5 rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E0E3E7] mb-4 gap-2">
          <div>
            <h3 className="text-sm font-semibold text-ink">
              Control de Flujo Instrumental
            </h3>
            <p className="text-xs text-ink-muted">
              Transiciones reguladas según las reglas de negocio de la máquina de estados
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-ink-muted">Estado actual:</span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F0FE] text-[#1A73E8] uppercase tracking-wide">
              {estadoActual.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* borrador → enviado */}
          {estadoActual === 'borrador' && (
            <button
              onClick={() => ejecutarTransicion('enviado', 'Informe completado y enviado a revisión')}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-lg font-semibold transition shadow-xs hover:shadow-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Enviar a Revisión (borrador → enviado)</span>
            </button>
          )}

          {/* enviado → en_revision (solo revisores) */}
          {estadoActual === 'enviado' && esRevisor && (
            <button
              onClick={() => ejecutarTransicion('en_revision', 'Revisor inició proceso de auditoría')}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#00796B] hover:bg-[#00695C] text-white rounded-lg font-semibold transition shadow-xs hover:shadow-sm disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Iniciar Revisión (enviado → en_revision)</span>
            </button>
          )}

          {/* observado → borrador (reapertura) */}
          {estadoActual === 'observado' && (
            <button
              onClick={() => ejecutarTransicion('borrador', 'Reapertura tras observación para subir nueva versión')}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#E37400] hover:bg-[#D56800] text-white rounded-lg font-semibold transition shadow-xs hover:shadow-sm disabled:opacity-50"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Devolver a Borrador (observado → borrador)</span>
            </button>
          )}

          {/* rechazado → borrador (reapertura) */}
          {estadoActual === 'rechazado' && (
            <button
              onClick={() => ejecutarTransicion('borrador', 'Reapertura de expediente para corrección mayor')}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-[#DADCE0] hover:bg-[#F8F9FA] text-[#202124] rounded-lg font-medium transition shadow-xs disabled:opacity-50"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Devolver a Borrador (rechazado → borrador)</span>
            </button>
          )}
        </div>
      </div>

      {/* Visor de documentos y LanguageTool (solo en_revision y para revisor/admin) */}
      {estadoActual === 'en_revision' && esRevisor && (
        <>
          {/* Visor Documental */}
          <div className="bg-white border border-[#E0E3E7] p-5 rounded-xl shadow-xs text-xs space-y-4">
            <div className="pb-3 border-b border-[#E0E3E7]">
              <h3 className="text-sm font-semibold text-ink">
                Visor Documental y Verificación Ortográfica
              </h3>
              <p className="text-xs text-ink-muted">
                Carga el documento de la versión seleccionada para examinarlo antes de emitir dictamen
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={versionSeleccionada}
                onChange={(e) => setVersionSeleccionada(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 border border-[#DADCE0] rounded-lg bg-white text-ink font-medium text-xs focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none"
              >
                <option value="">-- Seleccionar Versión --</option>
                {versiones.map((v) => (
                  <option key={v.id} value={v.id}>
                    Versión {v.numero_version} — {v.archivo_nombre}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={cargarDocumento}
                disabled={!versionSeleccionada || docLoading}
                className="flex items-center gap-2 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-lg font-semibold disabled:opacity-50 transition shadow-xs"
              >
                {docLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
                <span>{docLoading ? 'Cargando...' : 'Cargar Documento'}</span>
              </button>

              {docContent && (
                <button
                  type="button"
                  onClick={verificarOrtografia}
                  disabled={ltLoading}
                  className="flex items-center gap-2 px-4 py-2 border border-[#E37400] text-[#E37400] hover:bg-[#FEF7E0] rounded-lg font-semibold disabled:opacity-50 transition"
                >
                  {ltLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                  <span>{ltLoading ? 'Analizando...' : 'Verificar Ortografía'}</span>
                </button>
              )}
            </div>

            {/* Resultados de LanguageTool */}
            {ltMatches.length > 0 && (
              <div className="p-4 bg-[#FEF7E0] border border-[#FEEFC3] rounded-xl space-y-3">
                <div className="flex items-center gap-2 font-semibold text-[#B06000] text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#E37400]" />
                  <span>{ltMatches.length} {ltMatches.length === 1 ? 'observación detectada' : 'observaciones detectadas'} por LanguageTool</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {ltMatches.map((match, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs p-2.5 bg-white rounded-lg border border-[#FEEFC3] shadow-xs">
                      <span className="shrink-0 font-mono font-bold text-[#D93025] w-5">{idx + 1}.</span>
                      <div className="min-w-0">
                        <div className="text-ink font-medium">{match.message}</div>
                        {match.replacements[0] && (
                          <div className="text-[#1E8E3E] font-medium mt-0.5">
                            Sugerencia: «{match.replacements[0].value}»
                          </div>
                        )}
                        <div className="text-ink-muted font-mono text-[11px] mt-0.5 truncate">
                          Contexto: "...{match.context.text}..."
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contenido del documento renderizado */}
            {docContent && (
              <div className="border border-[#E0E3E7] rounded-xl bg-[#F8F9FA] p-5 max-h-96 overflow-y-auto">
                {docHtml ? (
                  <div
                    className="prose prose-sm max-w-none text-xs text-ink font-sans [&_.lt-error]:bg-yellow-100 [&_.lt-error]:border-b-2 [&_.lt-error]:border-[#E37400] [&_.lt-error]:cursor-help"
                    dangerouslySetInnerHTML={{ __html: docHtml }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-xs font-mono text-ink leading-relaxed">
                    {docContent}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Formulario Formal de Revisión */}
          <div className="bg-white border border-[#E0E3E7] p-5 rounded-xl shadow-xs text-xs space-y-4">
            <div className="pb-3 border-b border-[#E0E3E7]">
              <h3 className="text-sm font-semibold text-ink">
                Emisión de Dictamen Técnico y Calidad
              </h3>
              <p className="text-xs text-ink-muted">
                Registra el veredicto oficial y las observaciones específicas del proceso de revisión
              </p>
            </div>

            <form onSubmit={emitirRevision} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-ink">
                    Versión Evaluada
                  </label>
                  <select
                    value={versionSeleccionada}
                    onChange={(e) => setVersionSeleccionada(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DADCE0] rounded-lg bg-white text-ink font-medium text-xs focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none"
                    required
                  >
                    <option value="">-- Seleccionar Versión --</option>
                    {versiones.map((v) => (
                      <option key={v.id} value={v.id}>
                        Versión {v.numero_version} — {v.archivo_nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-ink">
                    Resultado del Dictamen
                  </label>
                  <select
                    value={resultado}
                    onChange={(e) => setResultado(e.target.value as ResultadoRevision)}
                    className="w-full px-3 py-2 border border-[#DADCE0] rounded-lg bg-white text-ink font-semibold text-xs focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none"
                  >
                    <option value="observado">OBSERVADO (Requiere subsanación)</option>
                    <option value="aprobado">APROBADO (Conforme a norma)</option>
                    <option value="rechazado">RECHAZADO (No cumple requisitos)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-ink">
                  Dictamen General / Veredicto Técnico
                </label>
                <textarea
                  rows={3}
                  value={dictamen}
                  onChange={(e) => setDictamen(e.target.value)}
                  placeholder="Detalle la fundamentación técnica del dictamen..."
                  className="w-full px-3.5 py-2.5 border border-[#DADCE0] rounded-lg bg-white text-ink placeholder-[#80868B] text-xs focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition"
                  required
                />
              </div>

              {/* Observaciones en bloque */}
              {resultado === 'observado' && (
                <div className="space-y-3 pt-3 border-t border-[#E0E3E7]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-ink">
                      Observaciones Puntuales a Subsanar ({observaciones.filter((o) => o.trim()).length})
                    </label>
                    <button
                      type="button"
                      onClick={agregarObservacion}
                      className="flex items-center gap-1 text-xs text-[#1A73E8] font-semibold hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar punto</span>
                    </button>
                  </div>

                  {observaciones.map((obs, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#5F6368] w-5 text-right font-bold">{idx + 1}.</span>
                      <input
                        type="text"
                        value={obs}
                        onChange={(e) => actualizarObservacion(idx, e.target.value)}
                        placeholder="Ej: Calibrar electrodo de pH y reportar incertidumbre..."
                        className="flex-1 px-3 py-2 border border-[#DADCE0] rounded-lg bg-white text-[#202124] placeholder-[#80868B] text-xs focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none"
                      />
                      {observaciones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => quitarObservacion(idx)}
                          className="text-[#5F6368] hover:text-[#D93025] p-1.5 rounded-lg hover:bg-red-50 transition"
                          title="Eliminar observación"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-[#E0E3E7] flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-lg font-semibold text-xs transition shadow-xs hover:shadow-sm disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{loading ? 'Emitiendo Dictamen...' : 'Emitir Dictamen Oficial'}</span>
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
