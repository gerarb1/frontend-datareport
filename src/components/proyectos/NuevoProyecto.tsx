import React, { useState } from 'react';
import { api } from '@/lib/api';
import { AppProviders } from '../providers/AppProviders';
import { AuthGuard } from '../auth/AuthGuard';
import { FolderPlus, AlertCircle, Save, Loader2, ArrowLeft } from 'lucide-react';

function NuevoProyectoContent() {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await api.proyectos.crear({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
      });

      if (res.success) {
        // Redirigir a la lista tras crear con éxito
        window.location.replace('/proyectos');
      } else {
        setErrorMsg(res.error || 'No se pudo registrar el proyecto en MS Academic');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de conexión con el servidor';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-ink">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center shrink-0">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink tracking-tight">Registrar Nuevo Proyecto</h1>
            <p className="text-xs text-ink-muted">
              Registra una investigación en el repositorio académico (MS Academic)
            </p>
          </div>
        </div>
        <a
          href="/proyectos"
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border border-[#DADCE0] hover:bg-white rounded-lg transition-colors text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a Proyectos</span>
        </a>
      </div>

      {errorMsg && (
        <div className="p-4 bg-[#FCE8E6] border border-[#FAD2CF] text-[#D93025] text-xs rounded-xl flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#E0E3E7] rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold mb-1.5 text-ink">
            Título de la Investigación / Proyecto *
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Análisis de calidad de agua en la cuenca baja del río Guayas..."
            className="w-full px-3.5 py-2.5 text-sm border border-[#DADCE0] rounded-lg bg-white text-ink placeholder-[#80868B] focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition"
            required
            minLength={5}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5 text-ink">
            Descripción Técnica (Opcional)
          </label>
          <textarea
            rows={4}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Alcance, objetivos y parámetros a medir en el proyecto..."
            className="w-full px-3.5 py-2.5 text-sm border border-[#DADCE0] rounded-lg bg-white text-ink placeholder-[#80868B] focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition"
          />
        </div>

        <div className="pt-4 border-t border-[#E0E3E7] flex justify-end gap-3">
          <a
            href="/proyectos"
            className="px-4 py-2 border border-[#DADCE0] hover:bg-gray-50 text-ink-muted hover:text-ink rounded-lg text-xs font-semibold transition"
          >
            Cancelar
          </a>
          <button
            type="submit"
            disabled={loading || !titulo.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-lg text-xs font-semibold transition shadow-xs hover:shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{loading ? 'Registrando...' : 'Registrar Proyecto'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

// Exportamos la vista aislada con su contexto y protección
export function NuevoProyectoView() {
  return (
    <AppProviders>
      <AuthGuard allowedRoles={['superadmin', 'investigador']}>
        <NuevoProyectoContent />
      </AuthGuard>
    </AppProviders>
  );
}