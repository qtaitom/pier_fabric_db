export type MaterialStatus =
  | "Jóváhagyásra vár"
  | "Jóváhagyva"
  | "Felhasználva"
  | "Archivált";

export interface Material {
  itemId: string;
  szallitoiCikkszam: string;
  anyagtipus: string;
  szallito: string;
  teljesSzelesseg: number | null;
  hasznoszelesseg: number | null;
  suly: number | null;
  osszetétel: string;
  ar: string;
  fuvarparitas: string;
  sampleMoq: string;
  bulkMoq: string;
  gyartasiIdo: string;
  htsCode: string;
  statusz: MaterialStatus | string;
  feltoltve: string;
  pdfUrl: string;
}

export interface ApiResponse {
  data: Material[];
  total: number;
  lastUpdated: string;
}
