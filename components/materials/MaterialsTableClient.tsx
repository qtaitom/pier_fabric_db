"use client";

import { useEffect, useState } from "react";
import MaterialsTable from "./MaterialsTable";
import { Skeleton } from "@/components/ui/skeleton";
import type { Material } from "@/app/lib/types";

export default function MaterialsTableClient() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/materials")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setMaterials(json.data);
        setLastUpdated(json.lastUpdated);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-red-700 text-sm">
        <strong>Hiba:</strong> {error}
      </div>
    );
  }

  return <MaterialsTable materials={materials} lastUpdated={lastUpdated} />;
}
