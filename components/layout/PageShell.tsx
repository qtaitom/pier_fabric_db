"use client";

import { useState, useCallback } from "react";
import Sidebar from "./Sidebar";
import MaterialsTable from "@/components/materials/MaterialsTable";
import PdfUploader from "@/components/materials/PdfUploader";
import type { Material } from "@/app/lib/types";

interface Props {
  materials: Material[];
  lastUpdated: string;
}

export default function PageShell({ materials: initialMaterials, lastUpdated }: Props) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [showUpload, setShowUpload] = useState(false);

  const handleSaved = useCallback(() => {
    setShowUpload(false);
    fetch("/api/materials")
      .then((r) => r.json())
      .then((json) => { if (json.data) setMaterials(json.data); });
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="flex items-center justify-between px-8"
          style={{
            background: "var(--surface)",
            borderBottom: "1px solid var(--pier-border)",
            height: 54,
            position: "sticky",
            top: 0,
            zIndex: 10,
            // helyet hagyunk a fix "Indítópult" pirulának (jobb felső sarok)
            paddingRight: 160,
          }}
        >
          <h1 className="font-semibold" style={{ color: "var(--ink)", fontSize: 15 }}>
            Anyagadatbázis
          </h1>
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium transition-all"
            style={{
              background: showUpload ? "var(--surface2)" : "var(--pier-accent)",
              color: showUpload ? "var(--ink2)" : "#fff",
              border: `1px solid ${showUpload ? "var(--pier-border2)" : "var(--pier-accent)"}`,
              borderRadius: "var(--rsm)",
            }}
          >
            {showUpload ? "Bezárás" : "+ TDS feltöltése"}
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto px-8 py-6 space-y-5">
          {showUpload && (
            <div
              className="p-6"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--pier-border)",
                borderRadius: "var(--rlg)",
              }}
            >
              <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "var(--ink2)" }}>
                TDS adatlap elemzése
              </p>
              <PdfUploader onSaved={handleSaved} />
            </div>
          )}

          <MaterialsTable materials={materials} lastUpdated={lastUpdated} />
        </main>
      </div>
    </div>
  );
}
