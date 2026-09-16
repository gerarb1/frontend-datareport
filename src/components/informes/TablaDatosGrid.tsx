import React, { useState, useMemo } from 'react';
import { DataGrid } from 'react-data-grid';
import type { Column } from 'react-data-grid';
import type { CeldaInvalida } from '@/lib/types';
import { AlertTriangle, Download, Save, CheckCircle2 } from 'lucide-react';

interface FilaDato {
  id: string | number;
  estacion: string;
  latitud: number;
  longitud: number;
  ph: number;
  temperatura_c: number;
  oxigeno_disuelto: number;
  conductividad: number;
  turbidez_ntu: number;
  fecha_muestreo: string;
  [key: string]: any;
}

interface TablaDatosGridProps {
  informeId: string;
  readonly?: boolean;
}

const FILAS_EJEMPLO: FilaDato[] = [
  { id: '1', estacion: 'EST-01A', latitud: -0.2298, longitud: -78.5249, ph: 7.2, temperatura_c: 18.4, oxigeno_disuelto: 6.8, conductividad: 245, turbidez_ntu: 3.2, fecha_muestreo: '2026-09-01' },
  { id: '2', estacion: 'EST-01B', latitud: -0.2315, longitud: -78.5281, ph: 9.8, temperatura_c: 19.1, oxigeno_disuelto: 5.9, conductividad: 310, turbidez_ntu: 14.5, fecha_muestreo: '2026-09-01' }, // ph fuera de rango
  { id: '3', estacion: 'EST-02A', latitud: -0.2450, longitud: -78.5310, ph: 6.9, temperatura_c: 24.5, oxigeno_disuelto: 4.1, conductividad: 420, turbidez_ntu: 8.7, fecha_muestreo: '2026-09-02' },
  { id: '4', estacion: 'EST-02B', latitud: -0.2482, longitud: -78.5390, ph: 7.4, temperatura_c: 17.9, oxigeno_disuelto: 7.2, conductividad: 190, turbidez_ntu: 2.1, fecha_muestreo: '2026-09-02' },
  { id: '5', estacion: 'EST-03A', latitud: -0.2610, longitud: -78.5420, ph: 4.2, temperatura_c: 21.0, oxigeno_disuelto: 2.8, conductividad: 680, turbidez_ntu: 28.0, fecha_muestreo: '2026-09-03' }, // ph ácido alarma
  { id: '6', estacion: 'EST-03B', latitud: -0.2655, longitud: -78.5475, ph: 7.0, temperatura_c: 18.0, oxigeno_disuelto: 6.5, conductividad: 230, turbidez_ntu: 4.0, fecha_muestreo: '2026-09-03' },
  { id: '7', estacion: 'EST-04A', latitud: -0.2801, longitud: -78.5512, ph: 7.3, temperatura_c: 18.2, oxigeno_disuelto: 6.9, conductividad: 215, turbidez_ntu: 3.8, fecha_muestreo: '2026-09-04' },
];

// Celdas que no cumplen las reglas de control de calidad (ej: pH fuera de 6.5 - 8.5)
const CELDAS_INVALIDAS_INICIALES: CeldaInvalida[] = [
  { fila: '2', columna: 'ph', mensaje: 'pH 9.8 excede el límite máximo permitido (8.5)' },
  { fila: '5', columna: 'ph', mensaje: 'pH 4.2 inferior al rango neutro aceptable (6.5)' },
  { fila: '5', columna: 'turbidez_ntu', mensaje: 'Turbidez 28.0 NTU sobrepasa norma de referencia' },
];

export function TablaDatosGrid({ informeId, readonly = false }: TablaDatosGridProps) {
  const [filas, setFilas] = useState<FilaDato[]>(FILAS_EJEMPLO);
  const [celdasInvalidas, setCeldasInvalidas] = useState<CeldaInvalida[]>(CELDAS_INVALIDAS_INICIALES);
  const [guardado, setGuardado] = useState(false);

  const esCeldaInvalida = (filaId: string | number, colKey: string) => {
    return celdasInvalidas.find((c) => String(c.fila) === String(filaId) && c.columna === colKey);
  };

  const columns = useMemo<Column<FilaDato>[]>(() => [
    {
      key: 'id',
      name: '#',
      width: 50,
      frozen: true,
      renderCell: ({ row }) => <span className="font-mono text-ink-subtle">{row.id}</span>,
    },
    {
      key: 'estacion',
      name: 'Estación',
      width: 110,
      renderCell: ({ row }) => <span className="font-mono font-medium">{row.estacion}</span>,
    },
    {
      key: 'latitud',
      name: 'Latitud',
      width: 100,
      renderCell: ({ row }) => <span className="font-mono">{Number(row.latitud).toFixed(4)}</span>,
    },
    {
      key: 'longitud',
      name: 'Longitud',
      width: 100,
      renderCell: ({ row }) => <span className="font-mono">{Number(row.longitud).toFixed(4)}</span>,
    },
    {
      key: 'ph',
      name: 'pH (6.5-8.5)',
      width: 120,
      renderCell: ({ row }) => {
        const error = esCeldaInvalida(row.id, 'ph');
        if (error) {
          return (
            <span
              title={error.mensaje}
              className="text-alarma font-mono font-semibold bg-red-50/80 px-1 py-0.5 rounded-[2px] flex items-center justify-between"
            >
              <span>{row.ph}</span>
              <AlertTriangle className="w-3 h-3 text-alarma shrink-0 inline ml-1" />
            </span>
          );
        }
        return <span className="font-mono">{row.ph}</span>;
      },
    },
    {
      key: 'temperatura_c',
      name: 'Temp (°C)',
      width: 100,
      renderCell: ({ row }) => <span className="font-mono">{row.temperatura_c} °C</span>,
    },
    {
      key: 'oxigeno_disuelto',
      name: 'O₂ Dis. (mg/L)',
      width: 130,
      renderCell: ({ row }) => <span className="font-mono">{row.oxigeno_disuelto}</span>,
    },
    {
      key: 'conductividad',
      name: 'Cond. (µS/cm)',
      width: 120,
      renderCell: ({ row }) => <span className="font-mono">{row.conductividad}</span>,
    },
    {
      key: 'turbidez_ntu',
      name: 'Turbidez (NTU)',
      width: 130,
      renderCell: ({ row }) => {
        const error = esCeldaInvalida(row.id, 'turbidez_ntu');
        if (error) {
          return (
            <span
              title={error.mensaje}
              className="text-alarma font-mono font-semibold bg-red-50/80 px-1 py-0.5 rounded-[2px] flex items-center justify-between"
            >
              <span>{row.turbidez_ntu}</span>
              <AlertTriangle className="w-3 h-3 text-alarma shrink-0 inline ml-1" />
            </span>
          );
        }
        return <span className="font-mono">{row.turbidez_ntu}</span>;
      },
    },
    {
      key: 'fecha_muestreo',
      name: 'Fecha Muestreo',
      width: 120,
      renderCell: ({ row }) => <span className="font-mono text-ink-subtle">{row.fecha_muestreo}</span>,
    },
  ], [celdasInvalidas]);

  const onRowsChange = (nuevasFilas: FilaDato[]) => {
    if (readonly) return;
    setFilas(nuevasFilas);
    setGuardado(false);
  };

  const handleGuardarDatos = () => {
    // Evaluación simulada de rangos QC
    const nuevasInvalidas: CeldaInvalida[] = [];
    filas.forEach((f) => {
      if (f.ph < 6.5 || f.ph > 8.5) {
        nuevasInvalidas.push({ fila: f.id, columna: 'ph', mensaje: `pH ${f.ph} fuera de rango permitido (6.5 - 8.5)` });
      }
      if (f.turbidez_ntu > 20) {
        nuevasInvalidas.push({ fila: f.id, columna: 'turbidez_ntu', mensaje: `Turbidez ${f.turbidez_ntu} NTU excede umbral de alarma` });
      }
    });

    setCeldasInvalidas(nuevasInvalidas);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  const exportarCSV = () => {
    const headers = Object.keys(filas[0]).join(',');
    const rows = filas.map((f) => Object.values(f).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataset_qc_${informeId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Grid Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white border border-border p-2.5 rounded-[3px]">
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold uppercase tracking-wider font-mono text-ink">
            Matriz de Mediciones Físico-Químicas
          </div>
          {celdasInvalidas.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-alarma/30 text-alarma text-[11px] font-mono rounded-[2px]">
              <AlertTriangle className="w-3 h-3" />
              <span>{celdasInvalidas.length} anomalías detectadas</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportarCSV}
            className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border rounded-[3px] hover:bg-base text-ink font-mono transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          {!readonly && (
            <button
              type="button"
              onClick={handleGuardarDatos}
              className="flex items-center gap-1 px-3 py-1 bg-accent hover:bg-accent-hover text-white text-xs rounded-[3px] font-medium transition-colors"
            >
              {guardado ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
              <span>{guardado ? 'Verificado' : 'Validar y Guardar'}</span>
            </button>
          )}
        </div>
      </div>

      {/* React Data Grid Table */}
      <div className="bg-white border border-border rounded-[3px] overflow-hidden">
        <DataGrid
          columns={columns}
          rows={filas}
          onRowsChange={onRowsChange}
          className="rdg-light text-xs"
          rowHeight={32}
          headerRowHeight={34}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-ink-subtle px-1">
        <span>* Doble clic en celda para editar valores numéricos</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-alarma inline-block rounded-full" />
          <span>Rojo (#C4432B) = Celda fuera de rango paramétrico QC</span>
        </span>
      </div>
    </div>
  );
}
