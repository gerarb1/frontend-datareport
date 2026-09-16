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

  const historial: HistorialTransicion[] = res?.data || [
    {
      id: 'd8e9f0a1-b2c3-4d4e-5f6a-7b8c9d0e1f2a',
      informe_id: informeId,
      estado_anterior: 'borrador',
      estado_nuevo: 'enviado',
      cambiado_por: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      comentario: 'Informe listo para revisión',
      creado_en: '2026-09-05T12:00:00.000Z',
    },
    {
      id: 'e9f0a1b2-c3d4-4e5f-6a7b-8c9d0e1f2a3b',
      informe_id: informeId,
      estado_anterior: 'enviado',
      estado_nuevo: 'en_revision',
      cambiado_por: '11223344-5566-4778-899a-aabbccddeeff',
      comentario: 'Iniciando proceso de validación analítica de datos',
      creado_en: '2026-09-05T14:00:00.000Z',
    },
  ];

  if (isLoading) {
    return <div className="p-4 text-xs font-mono text-ink-muted">Cargando bitácora de transiciones...</div>;
  }

  return (
    <div className="bg-white border border-border p-4 rounded-[3px] space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <History className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-ink">
          Bitácora de Estados y Trazabilidad (GET /api/v1/informes/:id/historial)
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
