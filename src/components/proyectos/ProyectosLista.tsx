// src/components/proyectos/ProyectosLista.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppProviders } from '../providers/AppProviders';
import { AuthGuard } from '../auth/AuthGuard';

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
    <div className="grid gap-4">
      {proyectos.length === 0 && (
        <p className="text-xs text-ink-subtle">No hay proyectos disponibles.</p>
      )}
      {proyectos.map((proyecto: any) => (
        <div key={proyecto.id} className="p-4 border border-border bg-white rounded-[3px]">
          <h4 className="text-sm font-semibold text-ink">{proyecto.titulo}</h4>
          {proyecto.descripcion && (
            <p className="text-xs text-ink-muted mt-1">{proyecto.descripcion}</p>
          )}
        </div>
      ))}
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