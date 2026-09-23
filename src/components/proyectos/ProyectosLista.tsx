// src/components/proyectos/ProyectosLista.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AppProviders } from '../providers/AppProviders';
import { AuthGuard } from '../auth/AuthGuard';
import { useState } from 'react';
import { Plus, FolderKanban, Search, ArrowRight, Folder } from 'lucide-react';

function ProyectosListaContent() {
  const [busqueda, setBusqueda] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['proyectos'],
    queryFn: async () => {
      const response = await api.proyectos.listar();
      return (response as any).data?.data || response.data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-[#5F6368] font-sans">
        <FolderKanban className="w-8 h-8 mx-auto text-[#1A73E8] animate-bounce mb-3" />
        Cargando proyectos de investigación...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-[#FCE8E6] border border-[#FAD2CF] text-[#D93025] rounded-xl text-xs font-mono">
        <h3 className="font-bold">Error al cargar proyectos</h3>
        <p>{error instanceof Error ? error.message : 'Error de conexión'}</p>
      </div>
    );
  }

  const proyectos = Array.isArray(data) ? data : [];
  const proyectosFiltrados = proyectos.filter((p: any) =>
    (p.titulo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.descripcion || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.id || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-5 text-ink">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E0E3E7] p-5 rounded-xl shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink tracking-tight">Proyectos de Investigación</h2>
            <p className="text-xs text-ink-muted">
              {proyectos.length} {proyectos.length === 1 ? 'proyecto registrado' : 'proyectos registrados'} en el repositorio académico
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar proyecto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-[#F8F9FA] border border-[#DADCE0] rounded-lg text-ink placeholder-[#80868B] focus:bg-white focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none w-56 transition"
            />
          </div>

          <a
            href="/proyectos/nuevo"
            className="flex items-center gap-2 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold rounded-lg transition shadow-xs hover:shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proyecto</span>
          </a>
        </div>
      </div>

      {/* Grid of Projects */}
      <div className="grid gap-3.5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {proyectosFiltrados.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white border border-[#E0E3E7] rounded-xl text-xs text-ink-muted">
            <Folder className="w-8 h-8 mx-auto text-[#BDC1C6] mb-2" />
            {busqueda ? 'No se encontraron proyectos con ese criterio de búsqueda.' : 'No hay proyectos registrados en este momento.'}
          </div>
        ) : (
          proyectosFiltrados.map((proyecto: any) => (
            <div
              key={proyecto.id}
              className="p-5 border border-[#E0E3E7] bg-white hover:border-[#1A73E8] hover:shadow-sm transition-all rounded-xl flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#F1F3F4] text-ink-muted">
                    ID: {proyecto.id.slice(0, 8)}...
                  </span>
                  <div className="w-7 h-7 rounded-md bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
                    <Folder className="w-3.5 h-3.5" />
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-ink group-hover:text-[#1A73E8] transition-colors line-clamp-2">
                  {proyecto.titulo}
                </h4>

                {proyecto.descripcion && (
                  <p className="text-xs text-ink-muted mt-2 line-clamp-3 leading-relaxed">
                    {proyecto.descripcion}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-[#F1F3F4] flex items-center justify-end">
                <a
                  href={`/informes?proyecto_id=${proyecto.id}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#1A73E8] hover:underline"
                >
                  <span>Ver Informes</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          ))
        )}
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