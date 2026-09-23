import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppProviders } from '../providers/AppProviders';
import { AuthGuard } from '../auth/AuthGuard';
import { FileText, ArrowRight, AlertCircle, Search } from 'lucide-react';
import { EstadoBadge } from '../common/EstadoBadge';
import { api } from '@/lib/api';

function InformesListaContent() {
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['informes'],
    queryFn: async () => {
      const res = await api.informes.listar();
      return (res as any).data || res || [];
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-[#5F6368]">Cargando repositorio de informes...</div>;
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-[#D93025] rounded-xl text-xs">
        <h3 className="font-bold flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Error al cargar informes</h3>
        <p className="mt-1">{error instanceof Error ? error.message : 'Fallo en la comunicación con el microservicio'}</p>
      </div>
    );
  }

  const informes: any[] = Array.isArray(data) ? data : [];

  const informesFiltrados = informes.filter(informe => {
    const estado = informe.estado_actual || informe.estado || 'borrador';
    const coincideEstado = filtroEstado === 'todos' || estado === filtroEstado;
    const coincideBusqueda = 
      !busqueda ||
      informe.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      informe.id?.toLowerCase().includes(busqueda.toLowerCase());
    return coincideEstado && coincideBusqueda;
  });

  const contarPorEstado = (est: string) => {
    if (est === 'todos') return informes.length;
    return informes.filter(i => (i.estado_actual || i.estado || 'borrador') === est).length;
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Repositorio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#202124] tracking-tight">Repositorio de Informes Técnicos</h1>
          <p className="text-xs text-[#5F6368] mt-1">Expedientes científicos bajo control de calidad y arbitraje</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda estilo Google Pills */}
      <div className="bg-white border border-[#E0E3E7] rounded-xl p-3 shadow-google flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#80868B] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por título o código de informe..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs border border-[#E0E3E7] rounded-full bg-[#F8F9FA] focus:bg-white focus:outline-none focus:border-[#1A73E8] focus:ring-2 focus:ring-[#1A73E8]/20 transition"
          />
        </div>

        {/* Píldoras de filtro */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'en_revision', label: 'En Revisión' },
            { id: 'observado', label: 'Observados' },
            { id: 'aprobado', label: 'Aprobados' },
            { id: 'borrador', label: 'Borradores' },
          ].map(f => {
            const count = contarPorEstado(f.id);
            const isSelected = filtroEstado === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFiltroEstado(f.id)}
                className={`px-3 py-1 rounded-full font-medium transition ${
                  isSelected
                    ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold'
                    : 'bg-white hover:bg-gray-100 text-[#5F6368] border border-[#E0E3E7]'
                }`}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabla Estilizada Datatable Google Cloud */}
      <div className="bg-white border border-[#E0E3E7] rounded-xl overflow-hidden shadow-google">
        {informesFiltrados.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#5F6368]">
            <FileText className="w-8 h-8 mx-auto text-[#BDC1C6] mb-2" />
            No se encontraron expedientes para los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#E0E3E7] text-[#5F6368] font-semibold uppercase text-[11px] tracking-wider select-none">
                  <th className="py-3 px-4">Informe Técnico</th>
                  <th className="py-3 px-4">Código / Proyecto</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E3E7]">
                {informesFiltrados.map((informe: any) => {
                  const estado = informe.estado_actual || informe.estado || 'borrador';
                  return (
                    <tr
                      key={informe.id}
                      className="hover:bg-[#F8F9FA] transition cursor-pointer"
                      onClick={() => window.location.href = `/informes/detalle?id=${informe.id}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-sm text-[#202124] hover:text-[#1A73E8] transition">
                          {informe.titulo}
                        </div>
                        <div className="text-xs text-[#5F6368] mt-0.5 font-mono">
                          ID: {informe.id}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#5F6368]">
                        {informe.proyecto_id ? `PRJ: ${informe.proyecto_id.slice(0, 8)}` : 'Sin asignar'}
                      </td>
                      <td className="py-3.5 px-4">
                        <EstadoBadge estado={estado} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={`/informes/detalle?id=${informe.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            estado === 'observado'
                              ? 'bg-[#D93025] hover:bg-red-700 text-white'
                              : 'border border-[#E0E3E7] hover:bg-gray-50 text-[#1A73E8]'
                          }`}
                        >
                          <span>{estado === 'observado' ? 'Subsanar' : 'Abrir'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function InformesView() {
  return (
    <AppProviders>
      <AuthGuard allowedRoles={['superadmin', 'investigador', 'revisor']}>
        <InformesListaContent />
      </AuthGuard>
    </AppProviders>
  );
}
