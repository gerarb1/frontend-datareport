import React, { useState, useMemo, useRef } from 'react';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { read, utils, writeFile } from 'xlsx';
import { AlertTriangle, Download, Save, Upload, FileSpreadsheet } from 'lucide-react';

interface TablaDatosGridProps {
  informeId: string;
  readonly?: boolean;
}

export function TablaDatosGrid({ informeId, readonly = false }: TablaDatosGridProps) {
  const [filas, setFilas] = useState<any[]>([]);
  const [columnas, setColumnas] = useState<any[]>([]);
  const [anomalias, setAnomalias] = useState<{ filaIdx: number; colKey: string; msj: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reglas de validación basadas en el PRD
  const validarCelda = (key: string, valor: any): string | null => {
    const num = Number(valor);
    if (isNaN(num)) return null;

    const k = key.toLowerCase();
    if (k.includes('latitud') && (num < -90 || num > 90)) return 'Latitud fuera de rango físico (-90 a 90)';
    if (k.includes('longitud') && (num < -180 || num > 180)) return 'Longitud fuera de rango físico (-180 a 180)';
    if (k.includes('ph') && (num < 0 || num > 14)) return 'pH inválido (0-14)';
    if (k.includes('temperatura') && (num < -50 || num > 100)) return 'Temperatura sospechosa';
    return null;
  };

  const procesarExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    // Procesamiento 100% en el cliente usando la librería xlsx
    const workbook = read(data, { type: 'array' });
    const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = utils.sheet_to_json(primeraHoja);

    if (jsonData.length === 0) return;

    // Extraer nombres de columnas dinámicamente del Excel
    const colNames = Object.keys(jsonData[0] as object);
    const gridCols = colNames.map(key => ({
      key,
      name: key.toUpperCase(),
      editable: !readonly,
      resizable: true,
      renderCell: (props: any) => {
        const error = anomalias.find(a => a.filaIdx === props.rowIdx && a.colKey === key);
        if (error) {
          return (
            <div title={error.msj} className="flex items-center justify-between bg-red-50 text-alarma font-bold w-full h-full px-2">
              <span>{props.row[key]}</span>
              <AlertTriangle className="w-3 h-3" />
            </div>
          );
        }
        return <span className="px-2">{props.row[key]}</span>;
      }
    }));

    setColumnas(gridCols);
    setFilas(jsonData);
    ejecutarValidacion(jsonData, gridCols);
  };

  const ejecutarValidacion = (data: any[], cols: any[]) => {
    const errores: typeof anomalias = [];
    data.forEach((fila, filaIdx) => {
      cols.forEach(col => {
        const msj = validarCelda(col.key, fila[col.key]);
        if (msj) errores.push({ filaIdx, colKey: col.key, msj });
      });
    });
    setAnomalias(errores);
  };

  const handleRowsChange = (nuevasFilas: any[]) => {
    setFilas(nuevasFilas);
    ejecutarValidacion(nuevasFilas, columnas);
  };

  const exportarExcelCorregido = () => {
    if (filas.length === 0) return;
    const worksheet = utils.json_to_sheet(filas);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Datos Corregidos");
    // Esto fuerza la descarga en el navegador del cliente
    writeFile(workbook, `Dataset_Corregido_${informeId.slice(0,8)}.xlsx`);
  };

  return (
    <div className="bg-white border border-border rounded-[3px] space-y-0 overflow-hidden">
      <div className="p-4 border-b border-border bg-base/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-ink flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-accent" />
            Módulo de Edición de Datos Científicos
          </h3>
          <p className="text-[11px] font-mono text-ink-muted mt-1">
            Procesamiento en navegador. No consume base de datos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={procesarExcel}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border hover:bg-base text-ink text-xs font-mono rounded-[3px] transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Importar Archivo
          </button>

          {filas.length > 0 && (
            <button 
              onClick={exportarExcelCorregido}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-mono rounded-[3px] transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Exportar Corregido
            </button>
          )}
        </div>
      </div>

      {anomalias.length > 0 && (
        <div className="px-4 py-2 bg-red-50 border-b border-alarma/20 flex items-center gap-2 text-xs font-mono text-alarma">
          <AlertTriangle className="w-4 h-4" />
          <span>Se detectaron {anomalias.length} celdas con valores fuera de parámetros físicos posibles. Doble clic para editar.</span>
        </div>
      )}

      <div className="h-[400px] w-full">
        {filas.length > 0 ? (
          <DataGrid 
            columns={columnas} 
            rows={filas} 
            onRowsChange={handleRowsChange}
            className="h-full text-xs"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-ink-subtle border-t border-border border-dashed m-4 rounded-[3px] bg-base/50">
            <FileSpreadsheet className="w-8 h-8 mb-2 opacity-50" />
            <p className="font-mono text-xs">Sube un archivo Excel o CSV adjunto al informe para visualizarlo y editarlo.</p>
          </div>
        )}
      </div>
    </div>
  );
}