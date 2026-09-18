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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Registrar Nuevo Proyecto</h1>
          <p className="text-xs font-mono text-ink-muted mt-1">
            Endpoint: POST /api/v1/proyectos (MS Academic)
          </p>
        </div>
        <a
          href="/proyectos"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-border hover:bg-white rounded-[3px] transition-colors text-ink"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Repositorio</span>
        </a>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-alarma/40 text-alarma text-xs rounded-[3px] flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-border rounded-[3px] p-6 space-y-5">
        <div>
          <label className="block text-xs font-mono font-medium mb-1.5 text-ink">
            Título de la Investigación / Proyecto *
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Análisis de calidad de agua en la cuenca baja del río Guayas..."
            className="w-full px-3 py-2 text-sm border border-border rounded-[3px] bg-base focus:bg-white focus:outline-none focus:border-accent"
            required
            minLength={5}
          />
        </div>

        <div>
          <label className="block text-xs font-mono font-medium mb-1.5 text-ink">
            Descripción Técnica (Opcional)
          </label>
          <textarea
            rows={4}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Alcance, objetivos y parámetros a medir en el proyecto..."
            className="w-full px-3 py-2 text-sm border border-border rounded-[3px] bg-base focus:bg-white focus:outline-none focus:border-accent"
          />
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button
            type="submit"
            disabled={loading || !titulo.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-[3px] text-xs font-medium font-mono transition-colors disabled:opacity-50"
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