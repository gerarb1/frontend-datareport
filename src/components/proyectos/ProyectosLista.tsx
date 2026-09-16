import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getStoredUser } from '@/lib/api';
import type { Proyecto, CrearProyectoPayload } from '@/lib/types';
import { FolderKanban, Plus, RefreshCw, AlertCircle, Calendar, ArrowRight } from 'lucide-react';

export function ProyectosLista() {
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const canCreate = user?.rol === 'investigador' || user?.rol === 'superadmin';

  const [modalOpen, setModalOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['proyectos'],
    queryFn: api.proyectos.listar,
  });

  const crearMutation = useMutation({
    mutationFn: (payload: CrearProyectoPayload) => api.proyectos.crear(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      setModalOpen(false);
      setTitulo('');
      setDescripcion('');
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Error al crear el proyecto');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setFormError('El título del proyecto es obligatorio');
      return;
    }
    crearMutation.mutate({ titulo, descripcion });
  };

  const proyectos = response?.data || [];

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white border border-border p-3 rounded-[3px]">
        <div className="flex items-center gap-3">
          <FolderKanban className="w-5 h-5 text-accent" />
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Proyectos de Investigación</h2>
            <p className="text-[11px] font-mono text-ink-muted">
              {proyectos.length} {proyectos.length === 1 ? 'proyecto registrado' : 'proyectos registrados'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Recargar datos"
            className="p-1.5 border border-border rounded-[3px] text-ink-muted hover:text-ink hover:bg-base transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          {canCreate && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-[3px] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Proyecto</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="p-3 bg-red-50 border border-alarma/40 text-alarma text-xs rounded-[3px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-mono">{(error as any)?.message || 'Error al obtener proyectos'}</span>
          </div>
          <button onClick={() => refetch()} className="underline font-mono text-[11px]">
            Reintentar
          </button>
        </div>
      )}

      {/* Dense Table */}
      <div className="bg-white border border-border rounded-[3px] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-ink-muted">
            Cargando proyectos desde API v1...
          </div>
        ) : proyectos.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-ink-muted">
            No se encontraron proyectos activos en el repositorio.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-[#F0F2F0] text-ink font-semibold uppercase tracking-wider text-[10px] font-mono select-none">
                  <th className="py-2.5 px-3">Título</th>
                  <th className="py-2.5 px-3">Descripción</th>
                  <th className="py-2.5 px-3">Fecha de Creación</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {proyectos.map((p) => (
                  <tr key={p.id} className="hover:bg-base/60 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-ink">
                      <div className="font-sans font-semibold">{p.titulo}</div>
                      <div className="font-mono text-[10px] text-ink-subtle">{p.id}</div>
                    </td>
                    <td className="py-2.5 px-3 text-ink-muted max-w-md truncate">
                      {p.descripcion || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-ink-subtle">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-border" />
                        <span>{new Date(p.creado_en).toLocaleDateString('es-ES')}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-mono border rounded-[3px] ${
                          p.activo
                            ? 'bg-estado-aprobado/10 text-estado-aprobado border-estado-aprobado/20'
                            : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}
                      >
                        {p.activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <a
                        href={`/informes?proyecto_id=${p.id}`}
                        className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline font-mono"
                      >
                        <span>Ver Informes</span>
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Proyecto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-border rounded-[4px] max-w-md w-full p-5 space-y-4">
            <div className="pb-3 border-b border-border">
              <h3 className="text-sm font-semibold text-ink">Nuevo Proyecto de Investigación</h3>
              <p className="text-[11px] font-mono text-ink-muted">
                Registra un marco de trabajo para agrupar informes y datasets
              </p>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-50 border border-alarma/40 text-alarma text-xs rounded-[3px] font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-medium mb-1 text-ink">
                  Título del Proyecto
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Análisis Microbiológico Cuenca Sur"
                  className="w-full px-3 py-1.5 text-xs border border-border rounded-[3px] bg-base focus:bg-white focus:outline-none focus:border-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium mb-1 text-ink">
                  Descripción General
                </label>
                <textarea
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Objetivos, alcance y metodología..."
                  className="w-full px-3 py-1.5 text-xs border border-border rounded-[3px] bg-base focus:bg-white focus:outline-none focus:border-accent"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs border border-border rounded-[3px] hover:bg-base text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={crearMutation.isPending}
                  className="px-3 py-1.5 text-xs bg-accent hover:bg-accent-hover text-white rounded-[3px] font-medium disabled:opacity-50"
                >
                  {crearMutation.isPending ? 'Creando...' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
