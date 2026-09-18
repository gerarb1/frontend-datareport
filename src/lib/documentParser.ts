// ─────────────────────────────────────────────────────────────
// documentParser.ts — Parsea archivos .docx, .csv, .xlsx y .pdf
// en el cliente usando mammoth, papaparse, xlsx y pdfjs-dist.
// ─────────────────────────────────────────────────────────────

export interface ParseResult {
  text: string;
  html?: string;
  rows?: Record<string, unknown>[];
  columns?: string[];
  pageCount?: number;
}

/**
 * Extrae texto/HTML de un archivo .docx usando mammoth.
 */
export async function parseDocx(file: File | Blob): Promise<ParseResult> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const textResult = await mammoth.extractRawText({ arrayBuffer });
  return {
    text: textResult.value,
    html: result.value,
  };
}

/**
 * Lee un archivo .csv usando PapaParse.
 * Soporta archivos grandes mediante streaming si el navegador lo permite.
 */
export async function parseCsv(file: File): Promise<ParseResult> {
  const Papa = await import('papaparse');
  return new Promise((resolve, reject) => {
    const rows: Record<string, unknown>[] = [];
    let columns: string[] = [];

    Papa.default.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      worker: true,
      step: (result) => {
        if (!columns.length && result.meta.fields) {
          columns = result.meta.fields;
        }
        rows.push(result.data as Record<string, unknown>);
      },
      complete: () => {
        const textLines = rows.map((r) => Object.values(r).join('\t')).join('\n');
        resolve({
          text: textLines,
          rows,
          columns,
        });
      },
      error: (err) => {
        reject(new Error(`Error al parsear CSV: ${err.message}`));
      },
    });
  });
}

/**
 * Lee un archivo .xlsx / .xls usando la librería xlsx (SheetJS).
 */
export async function parseXlsx(file: File | Blob): Promise<ParseResult> {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const text = rows.map((r) => Object.values(r).join('\t')).join('\n');

  return {
    text,
    rows,
    columns,
  };
}

/**
 * Extrae texto de un PDF usando pdfjs-dist.
 * Se carga el worker desde CDN para compatibilidad con Cloudflare Pages/Workers.
 */
export async function parsePdf(file: File | Blob): Promise<ParseResult> {
  const pdfjsLib = await import('pdfjs-dist');

  // Configurar el worker desde CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    textParts.push(pageText);
  }

  return {
    text: textParts.join('\n\n'),
    pageCount: pdf.numPages,
  };
}

/**
 * Auto-detecta el tipo de archivo y parsea con la librería correspondiente.
 */
export async function parseDocument(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  const mime = file.type;

  if (name.endsWith('.docx') || mime.includes('wordprocessingml')) {
    return parseDocx(file);
  }
  if (name.endsWith('.csv') || mime === 'text/csv') {
    return parseCsv(file);
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || mime.includes('spreadsheetml')) {
    return parseXlsx(file);
  }
  if (name.endsWith('.pdf') || mime === 'application/pdf') {
    return parsePdf(file);
  }

  throw new Error(`Tipo de archivo no soportado: ${name} (${mime})`);
}
