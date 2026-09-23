import React, { useState, useRef } from 'react';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { read, utils, writeFile } from 'xlsx';
import { AlertCircle, Download, Upload, FileSpreadsheet } from 'lucide-react';

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
            <div title={error.msj} className="flex items-center justify-between bg-red-50 text-[#D93025] font-semibold w-full h-full px-2 border-l-2 border-l-[#D93025]">
              <span>{props.row[key]}</span>
              <AlertCircle className="w-3.5 h-3.5 shrink-0 ml-1 text-[#D93025]" />
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
    <div className="bg-white border border-[#E0E3E7] rounded-xl space-y-0 overflow-hidden shadow-google">
      <div className="p-4 border-b border-[#E0E3E7] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[#202124] flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#1A73E8]" />
            Módulo de Edición de Datos Científicos
          </h3>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Procesamiento en memoria de navegador. Validación física en tiempo real.
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#E0E3E7] hover:bg-gray-50 text-[#202124] text-xs font-medium rounded-lg transition"
          >
            <Upload className="w-3.5 h-3.5 text-[#5F6368]" />
            <span>Importar Archivo</span>
          </button>

          {filas.length > 0 && (
            <button 
              onClick={exportarExcelCorregido}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1E8E3E] hover:bg-[#188038] text-white text-xs font-semibold rounded-lg transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Corregido</span>
            </button>
          )}
        </div>
      </div>

      {anomalias.length > 0 && (
        <div className="px-4 py-3 bg-[#FCE8E6] border-b border-[#FAD2CF] flex items-center gap-2.5 text-xs text-[#D93025]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Se detectaron <strong>{anomalias.length}</strong> celdas con valores fuera de tolerancias físicas posibles. Haz doble clic para editar.
          </span>
        </div>
      )}

      <div className="h-[420px] w-full">
        {filas.length > 0 ? (
          <DataGrid 
            columns={columnas} 
            rows={filas} 
            onRowsChange={handleRowsChange}
            className="h-full text-xs font-mono"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[#5F6368] p-8 bg-[#F8F9FA]">
            <FileSpreadsheet className="w-10 h-10 mb-3 text-[#BDC1C6]" />
            <p className="text-xs font-medium text-[#202124]">No hay datos cargados en la grilla</p>
            <p className="text-xs text-[#5F6368] mt-1">Importa un archivo Excel (.xlsx, .xls) o CSV adjunto al informe para inspeccionarlo.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-white border border-[#E0E3E7] hover:bg-gray-50 rounded-lg text-xs font-semibold text-[#1A73E8] shadow-xs transition"
            >
              Seleccionar Archivo de Muestreo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
