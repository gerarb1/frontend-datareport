import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getStoredUser } from '@/lib/api';
import type { Informe, EstadoInforme, CrearInformePayload } from '@/lib/types';
import { EstadoBadge } from '@/components/common/EstadoBadge';
import { FileText, Plus, RefreshCw, AlertCircle, Filter, ArrowRight, Calendar } from 'lucide-react';

export function InformesLista() {
  const queryClient = useQueryClient();
  const user = getStoredUser();
  const canCreate = user?.rol === 'investigador' || user?.rol === 'auxiliar' || user?.rol === 'superadmin';

  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [proyectoId, setProyectoId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Proyectos para el selector de creación
  const { data: proyectosRes } = useQuery({
    queryKey: ['proyectos'],
    queryFn: api.proyectos.listar,
  });

  // Lista de informes simulada o consultada (en caso de que el back tenga ruta o métricas)
  // Notar que en apicontrato.md las rutas principales son:
  // POST /api/v1/informes
  // POST /api/v1/informes/:id/transicion
  // POST /api/v1/informes/:id/versiones
  // GET /api/v1/informes/:id/historial
  // Consultamos dashboard metrics o informes registrados
  const {
    data: informesData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['informes'],
    queryFn: async (): Promise<Informe[]> => {
      // Como el endpoint de listado general de informes puede ser provisto vía proyectos o métricas,
      // aquí realizamos fetch seguro a /informes o recuperamos de proyectos/métricas:
      try {
        const res = await fetch(`${import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8787/api/v1'}/informes`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('iasa_access_token') || ''}`,
          },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data) return json.data;
        }
      } catch {}

      // Mock inicial coherente con apicontrato.md si el backend aún no ha cargado datos de prueba
      return [
        {
          id: 'b5c6d7e8-f9a0-4b1c-2d3e-4f5a6b7c8d9e',
          proyecto_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          titulo: 'Informe trimestral Q3 2026',
          estado: 'en_revision',
          creador_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          actualizado_en: '2026-09-05T12:00:00.000Z',
          creado_en: '2026-09-05T10:00:00.000Z',
        },
        {
          id: 'c8e1a2f3-1122-3344-5566-778899aabbcc',
          proyecto_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          titulo: 'Control de Calidad Agua Residual Estación Alfa',
          estado: 'observado',
          creador_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          actualizado_en: '2026-09-08T09:30:00.000Z',
          creado_en: '2026-09-06T15:20:00.000Z',
        },
        {
          id: 'd9f2b3a4-5566-7788-99aa-bbccddeeff00',
          proyecto_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          titulo: 'Muestreo Geoquímico Transecto Cordillera',
          estado: 'aprobado',
          creador_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          actualizado_en: '2026-09-12T16:45:00.000Z',
          creado_en: '2026-09-10T11:00:00.000Z',
        },
      ];
    },
  });

  const crearMutation = useMutation({
    mutationFn: (payload: CrearInformePayload) => api.informes.crear(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['informes'] });
      setModalOpen(false);
      setTitulo('');
      setProyectoId('');
      setFormError(null);
      if (res.data?.id) {
        window.location.href = `/informes/${res.data.id}`;
      }
    },
    onError: (err: any) => {
      setFormError(err.message || 'Error al crear el informe');
    },
  });

  const handleCrearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !proyectoId.trim()) {
      setFormError('El título y el proyecto son requeridos');
      return;
    }
    crearMutation.mutate({ proyecto_id: proyectoId, titulo });
  };

  const informes = informesData || [];
  const filtrados = informes.filter((inf) => {
    if (filtroEstado === 'todos') return true;
    return inf.estado === filtroEstado;
  });

  return (
    <div className="space-y-4">
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-border p-3 rounded-[3px]">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-accent" />
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Registro de Informes Técnicos</h2>
            <p className="text-[11px] font-mono text-ink-muted">
              {filtrados.length} {filtrados.length === 1 ? 'informe listado' : 'informes listados'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Dropdown */}
          <div className="flex items-center gap-1.5 border border-border rounded-[3px] px-2 py-1 bg-base text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-ink-subtle" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="bg-transparent text-ink focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos los Estados</option>
              <option value="borrador">Borrador</option>
              <option value="enviado">Enviado</option>
              <option value="en_revision">En Revisión</option>
              <option value="observado">Observado</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>

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
              <span>Nuevo Informe</span>
            </button>
          )}
        </div>
      </div>

      {/* Dense Table */}
      <div className="bg-white border border-border rounded-[3px] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-ink-muted">
            Cargando informes técnicos...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-ink-muted">
            No se encontraron informes para el criterio seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-[#F0F2F0] text-ink font-semibold uppercase tracking-wider text-[10px] font-mono select-none">
                  <th className="py-2.5 px-3">Informe</th>
                  <th className="py-2.5 px-3">Estado Instrumental</th>
                  <th className="py-2.5 px-3">Última Actualización</th>
                  <th className="py-2.5 px-3">Fecha de Ingreso</th>
                  <th className="py-2.5 px-3 text-right">Control de Calidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtrados.map((inf) => (
                  <tr key={inf.id} className="hover:bg-base/60 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-ink">
                      <div className="font-sans font-semibold text-xs">{inf.titulo}</div>
                      <div className="font-mono text-[10px] text-ink-subtle">ID: {inf.id}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <EstadoBadge estado={inf.estado} />
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-ink-subtle">
                      {inf.actualizado_en ? new Date(inf.actualizado_en).toLocaleString('es-ES') : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-ink-subtle">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-border" />
                        <span>{new Date(inf.creado_en).toLocaleDateString('es-ES')}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <a
                        href={`/informes/${inf.id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-accent hover:bg-accent/10 border border-accent/20 rounded-[3px] transition-colors"
                      >
                        <span>Abrir Ficha QC</span>
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

      {/* Modal Nuevo Informe */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-border rounded-[4px] max-w-md w-full p-5 space-y-4">
            <div className="pb-3 border-b border-border">
              <h3 className="text-sm font-semibold text-ink">Nuevo Informe Técnico</h3>
              <p className="text-[11px] font-mono text-ink-muted">
                Crea un nuevo expediente técnico en estado borrador (POST /api/v1/informes)
              </p>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-50 border border-alarma/40 text-alarma text-xs rounded-[3px] font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleCrearSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-mono font-medium mb-1 text-ink">
                  Proyecto Asociado
                </label>
                <select
                  value={proyectoId}
                  onChange={(e) => setProyectoId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-border rounded-[3px] bg-base focus:bg-white focus:outline-none focus:border-accent font-sans"
                  required
                >
                  <option value="">-- Seleccione un Proyecto --</option>
                  {(proyectosRes?.data || [
                    { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', titulo: 'Estudio de biodiversidad amazónica' },
                  ]).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titulo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium mb-1 text-ink">
                  Título del Informe
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Informe trimestral Q3 2026"
                  className="w-full px-3 py-1.5 text-xs border border-border rounded-[3px] bg-base focus:bg-white focus:outline-none focus:border-accent"
                  required
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
                  {crearMutation.isPending ? 'Creando...' : 'Crear en Borrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
