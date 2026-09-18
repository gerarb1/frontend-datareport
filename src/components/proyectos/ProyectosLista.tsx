// src/components/proyectos/ProyectosLista.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppProviders } from '../providers/AppProviders';
import { AuthGuard } from '../auth/AuthGuard';
import { Plus, FolderKanban, AlertCircle, ArrowRight } from 'lucide-react';

// Renombramos tu función original a una función interna de contenido
function ProyectosListaContent() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['proyectos'],
    queryFn: async () => {
      const response = await api.proyectos.listar();
      return (response as any).data?.data || response.data || [];
    }
  });

  if (isLoading) return <div className="p-4 text-ink-muted font-mono text-xs">Cargando proyectos...</div>;

  if (isError) {
    return (
      <div className="p-4 bg-alarma/10 border border-alarma/40 text-alarma rounded-[3px] text-xs font-mono">
        <h3 className="font-bold">Error al cargar proyectos</h3>
        <p>{error instanceof Error ? error.message : 'Error de conexión'}</p>
      </div>
    );
  }

  const proyectos = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white border border-border p-4 rounded-[3px]">
        <div className="flex items-center gap-3">
          <FolderKanban className="w-5 h-5 text-accent" />
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Proyectos de Investigación</h2>
            <p className="text-[11px] font-mono text-ink-muted">
              {proyectos.length} {proyectos.length === 1 ? 'proyecto registrado' : 'proyectos registrados'} (MS Academic)
            </p>
          </div>
        </div>

        <a
          href="/proyectos/nuevo"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-[3px] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo Proyecto</span>
        </a>
      </div>

      <div className="grid gap-3">
        {proyectos.length === 0 && (
          <div className="p-8 text-center bg-white border border-dashed border-border rounded-[3px] text-xs text-ink-subtle">
            No hay proyectos registrados en este momento.
          </div>
        )}
        {proyectos.map((proyecto: any) => (
          <div key={proyecto.id} className="p-4 border border-border bg-white hover:border-accent transition-colors rounded-[3px] flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-ink">{proyecto.titulo}</h4>
              {proyecto.descripcion && (
                <p className="text-xs text-ink-muted mt-1 max-w-xl">{proyecto.descripcion}</p>
              )}
              <div className="text-[10px] font-mono text-ink-subtle mt-2">
                ID: {proyecto.id}
              </div>
            </div>

            <a
              href={`/informes?proyecto_id=${proyecto.id}`}
              className="flex items-center gap-1 text-xs font-mono text-accent hover:underline shrink-0"
            >
              <span>Ver Informes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// Exportamos el componente unificado que será llamado desde Astro
export function ProyectosView() {
  return (
    <AppProviders>
      <AuthGuard allowedRoles={['superadmin', 'investigador']}>
        <ProyectosListaContent />
      </AuthGuard>
    </AppProviders>
  );
}