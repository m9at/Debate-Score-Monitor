import ExcelJS from "exceljs";

export type Cell = string | number;
export type ColSpec = { wch: number };
export type MergeSpec = {
  s: { r: number; c: number };
  e: { r: number; c: number };
};

export type Sheet = {
  data: Cell[][];
  "!cols"?: ColSpec[];
  "!merges"?: MergeSpec[];
};

export type Workbook = {
  sheets: { name: string; sheet: Sheet }[];
};

export const utils = {
  book_new(): Workbook {
    return { sheets: [] };
  },
  aoa_to_sheet(data: Cell[][]): Sheet {
    return { data };
  },
  book_append_sheet(wb: Workbook, ws: Sheet, name: string): void {
    wb.sheets.push({ name, sheet: ws });
  },
};

function sanitizeSheetName(name: string): string {
  return name.replace(/[\\/?*[\]:]/g, "_").slice(0, 31) || "Sheet";
}

export async function writeFile(wb: Workbook, filename: string): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  for (const { name, sheet } of wb.sheets) {
    const ws = workbook.addWorksheet(sanitizeSheetName(name), {
      views: [{ rightToLeft: true }],
    });
    if (sheet["!cols"]) {
      ws.columns = sheet["!cols"].map((c) => ({ width: c.wch }));
    }
    sheet.data.forEach((row) => {
      ws.addRow(row);
    });
    if (sheet["!merges"]) {
      sheet["!merges"].forEach((m) => {
        ws.mergeCells(m.s.r + 1, m.s.c + 1, m.e.r + 1, m.e.c + 1);
      });
    }
  }
  const buf = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
