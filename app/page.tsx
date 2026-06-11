import { fetchMaterials } from "@/app/lib/google-sheets";
import PageShell from "@/components/layout/PageShell";

export const dynamic = "force-dynamic";

export default async function Home() {
  let materials = [];
  try {
    materials = await fetchMaterials();
  } catch {
    // build time vagy hálózati hiba esetén üres listával indul
  }
  const lastUpdated = new Date().toISOString();
  return <PageShell materials={materials} lastUpdated={lastUpdated} />;
}
