import { fetchMaterials } from "./google-sheets";
import type { Material } from "./types";

const CACHE_TTL = 60 * 1000; // 60 másodperc

let cachedData: Material[] = [];
let lastFetch = 0;
let fetchInProgress = false;

async function refresh() {
  if (fetchInProgress) return;
  fetchInProgress = true;
  try {
    cachedData = await fetchMaterials();
    lastFetch = Date.now();
  } catch (e) {
    console.error("Cache frissítési hiba:", e);
  } finally {
    fetchInProgress = false;
  }
}

export async function getCachedMaterials(): Promise<Material[]> {
  const now = Date.now();
  const stale = now - lastFetch > CACHE_TTL;

  if (cachedData.length === 0) {
    // Első hívás — be kell várni
    await refresh();
  } else if (stale) {
    // Adat van, de elavult — azonnal visszaadjuk a régit, háttérben frissítünk
    refresh();
  }

  return cachedData;
}

// Szerver induláskor azonnal tölt
refresh();
