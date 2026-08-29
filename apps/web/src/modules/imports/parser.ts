import ExcelJS from "exceljs";
import { createHash } from "node:crypto";
import { importMappingSchema, templateColumns, type ImportTarget } from "./schemas";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 1000;
const MAX_COLUMNS = 50;

function key(value: unknown) { return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
function cellValue(value: ExcelJS.CellValue): string {
  if (typeof value === "object" && value !== null) {
    if ("formula" in value) throw new Error("El archivo contiene fórmulas, que no están permitidas.");
    if ("text" in value) return String(value.text ?? "").trim();
    if ("richText" in value) return value.richText.map((part) => part.text).join("").trim();
    return "";
  }
  return String(value ?? "").trim();
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  for (let i = 0; i < text.length; i += 1) { const char = text[i]; const next = text[i + 1];
    if (char === '"' && quoted && next === '"') { field += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(field.trim()); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && next === "\n") i += 1; row.push(field.trim()); if (row.some(Boolean)) rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (quoted) throw new Error("CSV con comillas sin cerrar.");
  row.push(field.trim()); if (row.some(Boolean)) rows.push(row); return rows;
}

export type ParsedImportRow = { row_number: number; raw_data: Record<string,string>; normalized_data: Record<string,string> };
export async function parseImportFile(file: File, target: ImportTarget, mappingInput: unknown) {
  if (file.size === 0 || file.size > MAX_BYTES) throw new Error("El archivo debe tener entre 1 byte y 10 MB.");
  const extension = file.name.toLowerCase().split(".").pop(); if (extension !== "csv" && extension !== "xlsx") throw new Error("Solo se permiten archivos CSV o XLSX.");
  const raw = await file.arrayBuffer(); const buffer = Buffer.from(raw); let matrix: string[][];
  if (extension === "csv") matrix = parseCsv(buffer.toString("utf8"));
  else {
    const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(raw);
    if (workbook.worksheets.length !== 1) throw new Error("El XLSX debe tener exactamente una hoja.");
    const sheet = workbook.worksheets[0]; if (sheet.actualRowCount > MAX_ROWS + 1 || sheet.actualColumnCount > MAX_COLUMNS) throw new Error("El archivo supera el límite de 1.000 filas o 50 columnas.");
    matrix = []; sheet.eachRow({ includeEmpty: false }, (row) => matrix.push(Array.from({ length: Math.max(0, row.cellCount) }, (_, index) => cellValue(row.getCell(index + 1).value))));
  }
  if (matrix.length < 2 || matrix.length > MAX_ROWS + 1) throw new Error("El archivo debe incluir encabezados y entre 1 y 1.000 filas.");
  const headers = matrix[0].map(key); if (!headers.every(Boolean) || new Set(headers).size !== headers.length) throw new Error("Los encabezados deben ser únicos y no estar vacíos.");
  const mapping = importMappingSchema.parse(mappingInput); const fallback = templateColumns[target];
  const resolved = Object.fromEntries(Object.entries(mapping).filter(([, source]) => source).map(([field, source]) => [field, key(source)]));
  for (const field of fallback) if (!resolved[field] && headers.includes(field)) resolved[field] = field;
  const unavailable = Object.values(resolved).filter((source) => !headers.includes(source)); if (unavailable.length) throw new Error(`No se encontró el encabezado: ${unavailable[0]}.`);
  const rows: ParsedImportRow[] = matrix.slice(1).map((values, index) => {
    const raw_data = Object.fromEntries(headers.map((header, col) => [header, values[col] ?? ""]));
    const normalized_data = Object.fromEntries(Object.entries(resolved).map(([field, source]) => [field, raw_data[source] ?? ""]));
    return { row_number: index + 2, raw_data, normalized_data };
  });
  return { rows, mapping: resolved, contentHash: createHash("sha256").update(buffer).digest("hex"), extension, mime: extension === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
}

export function mappingHash(mapping: Record<string,string>) { return createHash("sha256").update(JSON.stringify(Object.entries(mapping).sort())).digest("hex"); }
