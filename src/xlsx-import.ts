import * as XLSX from "xlsx";
import { unzipSync, zipSync } from "fflate";
import {
  BULK_HEADERS,
  BULK_SCHEMA_VERSION,
  type BulkRow,
  type BulkTables,
  type BulkSheetName,
} from "./bulk-schema";
import type { EvidenceRecord, SharePackage } from "./model";
import { tablesToPackage } from "./bulk-import";
export async function importWorkbook(
  buffer: ArrayBuffer,
  records: EvidenceRecord[],
): Promise<SharePackage> {
  if (buffer.byteLength > 5_000_000)
    throw new Error("Workbook exceeds the 5 MB file limit. Split the batch.");
  let declared = 0,
    entries = 0;
  const zipped = unzipSync(new Uint8Array(buffer), {
    filter(file) {
      entries++;
      declared += file.originalSize;
      if (entries > 200 || declared > 20_000_000)
        throw new Error(
          "Workbook exceeds the 20 MB expanded limit or 200 archive entries.",
        );
      if (/vbaProject|\.bin$|externalLinks\//i.test(file.name))
        throw new Error(
          "Macro-enabled or externally linked workbooks are not supported. Save a plain .xlsx file.",
        );
      return true;
    },
  });
  if (
    !zipped["xl/workbook.xml"] ||
    Object.values(zipped).reduce((n, x) => n + x.length, 0) > 20_000_000
  )
    throw new Error("Invalid or oversized XLSX workbook.");
  // Rebuild from bounded buffers: never let a second ZIP parser inflate the original archive.
  const sanitized = zipSync(zipped, { level: 0 });
  const workbook = XLSX.read(sanitized, {
    type: "array",
    cellDates: true,
    cellFormula: true,
    cellHTML: false,
  });
  const allowed = ["Readme", ...Object.keys(BULK_HEADERS)];
  for (const name of workbook.SheetNames) {
    if (!allowed.includes(name))
      throw new Error(
        `Unexpected worksheet ${name}. Use the template's five tabs; no sheet is silently ignored.`,
      );
    for (const [address, cell] of Object.entries(workbook.Sheets[name]))
      if (!address.startsWith("!") && (cell as XLSX.CellObject).f !== undefined)
        throw new Error(
          `${name}!${address}: formulas are not supported. Paste values only.`,
        );
  }
  const readme = workbook.Sheets.Readme;
  if (
    readme?.A1?.v !== "format_version" ||
    readme?.B1?.v !== BULK_SCHEMA_VERSION
  )
    throw new Error(
      "Readme!A1 must be format_version and B1 must be 1. Use the published template.",
    );
  const scalar = (
    cell: XLSX.CellObject | undefined,
    where: string,
  ): string | number | boolean | null => {
    if (!cell || cell.v === undefined || cell.v === null) return null;
    if (cell.f !== undefined)
      throw new Error(
        `${where}: formulas are not supported. Paste values only.`,
      );
    if (cell.t === "d" || cell.v instanceof Date)
      throw new Error(
        `${where}: use plain year numbers or YYYY-MM-DD text, not Excel dates.`,
      );
    if (cell.t === "e")
      throw new Error(`${where}: Excel error value. Replace with plain data.`);
    if (typeof cell.v === "string") {
      if (cell.v.length > 32767)
        throw new Error(
          `${where}: cell text exceeds 32767 characters. Split the narrative into its sections.`,
        );
      return cell.v;
    }
    if (typeof cell.v === "number" || typeof cell.v === "boolean")
      return cell.v;
    throw new Error(
      `${where}: unsupported cell value. Paste plain text or a number.`,
    );
  };
  const tables = {} as BulkTables;
  for (const sheetName of Object.keys(BULK_HEADERS) as BulkSheetName[]) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error(`Missing ${sheetName} sheet.`);
    const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
    if (range.e.r > 2000 || range.e.c > 99)
      throw new Error(
        `${sheetName}: too many rows or columns; remove extra formatting and split the batch.`,
      );
    if (sheet["!merges"]?.length)
      throw new Error(`${sheetName}: unmerge cells in input tables.`);
    const headers = new Map<string, number>();
    for (let col = 0; col <= range.e.c; col++) {
      const address = XLSX.utils.encode_cell({ r: 0, c: col }),
        value = scalar(sheet[address], `${sheetName}!${address}`);
      if (value === null || value === "") continue;
      const header = String(value).trim();
      if (
        !(BULK_HEADERS[sheetName] as readonly string[]).includes(header) ||
        headers.has(header)
      )
        throw new Error(
          `${sheetName} row 1: unknown or duplicate header ${header}.`,
        );
      headers.set(header, col);
    }
    for (const header of BULK_HEADERS[sheetName])
      if (!headers.has(header))
        throw new Error(
          `${sheetName} row 1: missing header ${header}. Keep all template columns, even when cells are blank.`,
        );
    const columns = new Set(headers.values()),
      rows: BulkRow[] = [];
    for (let n = 1; n <= range.e.r; n++) {
      const values: BulkRow = {};
      let populated = false;
      for (let col = 0; col <= range.e.c; col++) {
        const value = scalar(
          sheet[XLSX.utils.encode_cell({ r: n, c: col })],
          `${sheetName} row ${n + 1}`,
        );
        if (!columns.has(col) && value !== null && value !== "")
          throw new Error(
            `${sheetName} row ${n + 1}: data outside a named column.`,
          );
      }
      for (const [header, col] of headers) {
        const value = scalar(
          sheet[XLSX.utils.encode_cell({ r: n, c: col })],
          `${sheetName} row ${n + 1}, ${header}`,
        );
        values[header] = value;
        populated ||= value !== null && String(value).trim() !== "";
      }
      if (populated) {
        values.__row = n + 1;
        rows.push(values);
      }
    }
    if (rows.some((r, i) => r.__row !== i + 2))
      throw new Error(
        `${sheetName}: remove blank rows between entries so row diagnostics stay exact.`,
      );
    rows.forEach((r) => delete r.__row);
    tables[sheetName] = rows;
  }
  return tablesToPackage(tables, records);
}
