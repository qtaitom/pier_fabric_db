import { google } from "googleapis";
import type { Material } from "./types";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const SHEET_NAME = "Materials";
// A: ID, B: Cikkszám, C: Típus, D: Beszállító,
// E: Teljes szélesség, F: Hasznos szélesség, G: Súly, H: Összetétel,
// I: Ár, J: Fuvarparitás, K: Sample MOQ, L: BULK MOQ,
// M: Gyártási idő, N: HTS kód, O: Státusz, P: Feltöltve, Q: PDF URL
const DATA_RANGE = `${SHEET_NAME}!A2:Q1000`;

function getAuthClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !privateKey) {
    throw new Error("Hiányzó Google API hitelesítő adatok.");
  }
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: SCOPES,
  });
}

function parseNumber(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const cleaned = value.replace(",", ".").replace(/[^\d.]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function rowToMaterial(row: string[]): Material {
  return {
    itemId:            row[0]  ?? "",
    szallitoiCikkszam: row[1]  ?? "",
    anyagtipus:        row[2]  ?? "",
    szallito:          row[3]  ?? "",
    teljesSzelesseg:   parseNumber(row[4]),
    hasznoszelesseg:   parseNumber(row[5]),
    suly:              parseNumber(row[6]),
    osszetétel:        row[7]  ?? "",
    ar:                row[8]  ?? "",
    fuvarparitas:      row[9]  ?? "",
    sampleMoq:         row[10] ?? "",
    bulkMoq:           row[11] ?? "",
    gyartasiIdo:       row[12] ?? "",
    htsCode:           row[13] ?? "",
    statusz:           row[14] ?? "Jóváhagyásra vár",
    feltoltve:         row[15] ?? "",
    pdfUrl:            row[16] ?? "",
  };
}

function materialToRow(m: Omit<Material, "feltoltve" | "itemId"> & { itemId?: string; feltoltve?: string }, itemId: string, feltoltve: string): unknown[] {
  return [
    itemId,
    m.szallitoiCikkszam,
    m.anyagtipus,
    m.szallito,
    m.teljesSzelesseg ?? "",
    m.hasznoszelesseg ?? "",
    m.suly ?? "",
    m.osszetétel,
    m.ar ?? "",
    m.fuvarparitas ?? "",
    m.sampleMoq ?? "",
    m.bulkMoq ?? "",
    m.gyartasiIdo ?? "",
    m.htsCode ?? "",
    m.statusz || "Jóváhagyásra vár",
    feltoltve,
    m.pdfUrl ?? "",
  ];
}

export async function fetchMaterials(): Promise<Material[]> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: DATA_RANGE,
  });
  const rows = response.data.values;
  if (!rows || rows.length === 0) return [];
  return rows.filter((row) => row[0]?.trim()).map((row) => rowToMaterial(row as string[]));
}

export async function appendMaterial(material: Omit<Material, "itemId" | "feltoltve">): Promise<string> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const existing = await fetchMaterials();
  const maxId = existing.reduce((max, m) => {
    const n = parseInt(m.itemId.replace(/\D/g, ""), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  const itemId = `MAT-${String(maxId + 1).padStart(4, "0")}`;
  const feltoltve = new Date().toLocaleDateString("hu-HU");

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!A:Q`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [materialToRow(material, itemId, feltoltve)] },
  });

  return itemId;
}

export async function updateMaterial(oldItemId: string, updated: Omit<Material, "feltoltve"> & { feltoltve?: string }): Promise<void> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!A2:A1000`,
  });

  const rows = response.data.values ?? [];
  const rowIndex = rows.findIndex((r) => r[0] === oldItemId);
  if (rowIndex === -1) throw new Error(`Nem található: ${oldItemId}`);

  const sheetRow = rowIndex + 2;
  const feltoltve = updated.feltoltve || new Date().toLocaleDateString("hu-HU");

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!A${sheetRow}:Q${sheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [materialToRow(updated, updated.itemId, feltoltve)] },
  });
}
