import React from 'react';
import { Plus } from 'lucide-react';

interface TopbarProps {
  seccion?: string;
  subtitulo?: string;
}

export function Topbar({ seccion, subtitulo }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-[#E0E3E7] px-6 flex items-center justify-between shrink-0 select-none z-10">
      {/* Breadcrumb contextual a la izquierda */}
      <div className="flex items-center gap-2 text-xs">
        {seccion && <span className="text-[#5F6368] font-medium">{seccion}</span>}
        {seccion && subtitulo && <span className="text-[#BDC1C6]">/</span>}
        {subtitulo && <span className="font-semibold text-[#1A73E8] truncate">{subtitulo}</span>}
      </div>

      {/* Acciones del Topbar estilo Google */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
          <span className="w-2 h-2 rounded-full bg-[#1E8E3E]"></span>
          Sistema QC Activo
        </span>

        <a
          href="/informes"
          className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs hover:shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Informe</span>
        </a>
      </div>
    </header>
  );
}
