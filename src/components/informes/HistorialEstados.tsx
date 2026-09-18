import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { HistorialTransicion } from '@/lib/types';
import { EstadoBadge } from '@/components/common/EstadoBadge';
import { History, ArrowRight, UserCheck, MessageSquare } from 'lucide-react';

interface HistorialEstadosProps {
  informeId: string;
}

export function HistorialEstados({ informeId }: HistorialEstadosProps) {
  const {
    data: res,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['historial', informeId],
    queryFn: () => api.informes.historial(informeId),
  });

  const historial: HistorialTransicion[] = res?.data || [];

  if (isLoading) {
    return <div className="p-4 text-xs font-mono text-ink-muted">Cargando bitácora de transiciones desde MS Academic...</div>;
  }

  if (isError) {
    return <div className="p-4 text-xs font-mono text-alarma">Error al cargar el historial de estados.</div>;
  }

  if (historial.length === 0) {
    return (
      <div className="bg-white border border-border p-4 rounded-[3px]">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <History className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-ink">
            Bitácora de Estados y Trazabilidad
          </h3>
        </div>
        <p className="text-xs font-mono text-ink-muted mt-3">No hay transiciones registradas aún.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border p-4 rounded-[3px] space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <History className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-ink">
          Bitácora de Estados y Trazabilidad (GET /api/v1/informes/:id/historial → MS2)
        </h3>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
        {historial.map((item, idx) => (
          <div key={item.id || idx} className="relative text-xs">
            <span className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-accent ring-2 ring-white" />

            <div className="flex flex-wrap items-center gap-2 mb-1">
              <EstadoBadge estado={item.estado_anterior} showDot={false} />
              <ArrowRight className="w-3 h-3 text-ink-subtle" />
              <EstadoBadge estado={item.estado_nuevo} />
              <span className="text-[11px] font-mono text-ink-subtle ml-auto">
                {new Date(item.creado_en).toLocaleString('es-ES')}
              </span>
            </div>

            {item.comentario && (
              <div className="flex items-start gap-1.5 mt-1 bg-base p-2 rounded-[2px] border border-border/50 text-[11px]">
                <MessageSquare className="w-3.5 h-3.5 text-ink-subtle shrink-0 mt-0.5" />
                <span className="text-ink">{item.comentario}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-ink-subtle">
              <UserCheck className="w-3 h-3" />
              <span>Operador: {item.cambiado_por}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
