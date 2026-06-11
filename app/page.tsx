import { fetchMaterials } from "@/app/lib/google-sheets";
import PageShell from "@/components/layout/PageShell";

export const revalidate = 60;

export default async function Home() {
  const materials = await fetchMaterials();
  const lastUpdated = new Date().toISOString();
  return <PageShell materials={materials} lastUpdated={lastUpdated} />;
}
