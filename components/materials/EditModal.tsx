"use client";

import { useState, useRef } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Material, MaterialStatus } from "@/app/lib/types";

const FIELD_LABELS: Partial<Record<keyof Material, string>> = {
  itemId:            "ID (ERP kód)",
  szallitoiCikkszam: "Cikkszám / megnevezés",
  anyagtipus:        "Típus",
  szallito:          "Beszállító",
  teljesSzelesseg:   "Teljes szélesség (cm)",
  hasznoszelesseg:   "Hasznos szélesség (cm)",
  suly:              "Súly (g/m²)",
  osszetétel:        "Összetétel",
  ar:                "Ár",
  fuvarparitas:      "Fuvarparitás",
  sampleMoq:         "Sample MOQ",
  bulkMoq:           "BULK MOQ",
  gyartasiIdo:       "Gyártási idő",
  htsCode:           "HTS kód",
  statusz:           "Státusz",
};

const NUMBER_FIELDS = new Set(["teljesSzelesseg", "hasznoszelesseg", "suly"]);
const STATUSES: MaterialStatus[] = ["Jóváhagyásra vár", "Jóváhagyva", "Felhasználva", "Archivált"];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  fontSize: 13,
  background: "var(--surface2)",
  border: "1px solid var(--pier-border)",
  borderRadius: "var(--rsm)",
  color: "var(--ink)",
  outline: "none",
  transition: "border-color .15s",
};

interface Props {
  material: Material;
  onClose: () => void;
  onSaved: (updated: Material) => void;
}

export default function EditModal({ material, onClose, onSaved }: Props) {
  const [data, setData] = useState<Material>({ ...material });
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [error, setError] = useState("");
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof Material, value: unknown) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const handlePdfUpload = async (file: File) => {
    if (file.type !== "application/pdf") { setError("Csak PDF fájl tölthető fel."); return; }
    setUploadingPdf(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const res = await fetch("/api/upload-pdf", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Feltöltési hiba");
      set("pdfUrl", json.pdfUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Feltöltési hiba.");
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/materials/${encodeURIComponent(material.itemId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Mentési hiba");
      onSaved(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hiba történt.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(14,28,43,0.55)" }}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--pier-border)",
          borderRadius: "var(--rlg)",
          boxShadow: "0 20px 60px rgba(14,28,43,0.25)",
          padding: 28,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--ink)" }}>Anyag szerkesztése</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--ink3)" }}>{material.itemId} · {material.szallitoiCikkszam}</p>
          </div>
          <button
            onClick={onClose}
            style={{ color: "var(--ink3)", fontSize: 18, lineHeight: 1, padding: "4px 6px", borderRadius: "var(--rsm)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            ✕
          </button>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {(Object.keys(FIELD_LABELS) as (keyof Material)[]).map((key) => (
            <div key={key}>
              <label className="block text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "var(--ink2)" }}>
                {FIELD_LABELS[key]}
                {key === "itemId" && (
                  <span className="ml-1 normal-case font-normal" style={{ color: "var(--pier-accent)" }}> — átírható ERP kódra</span>
                )}
              </label>
              {key === "statusz" ? (
                <Select value={data.statusz} onValueChange={(v) => set("statusz", v)}>
                  <SelectTrigger style={{ ...inputStyle, height: 34 }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <input
                  value={(data[key] as string | number) ?? ""}
                  onChange={(e) => {
                    const val = NUMBER_FIELDS.has(key)
                      ? e.target.value === "" ? null : Number(e.target.value)
                      : e.target.value;
                    set(key, val);
                  }}
                  type={NUMBER_FIELDS.has(key) ? "number" : "text"}
                  style={{
                    ...inputStyle,
                    fontFamily: key === "itemId" ? "'DM Mono', monospace" : undefined,
                    fontWeight: key === "itemId" ? 500 : undefined,
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--pier-accent)")}
                  onBlur={e => (e.target.style.borderColor = "var(--pier-border)")}
                />
              )}
            </div>
          ))}
        </div>

        {/* PDF section */}
        <div
          className="mb-5 p-4"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--pier-border)",
            borderRadius: "var(--rsm)",
          }}
        >
          <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: "var(--ink2)" }}>
            Csatolt adatlap (PDF)
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {data.pdfUrl ? (
              <a
                href={data.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium"
                style={{ color: "var(--pier-accent)" }}
              >
                Megnyitás ↗
              </a>
            ) : (
              <span className="text-sm" style={{ color: "var(--ink3)" }}>Nincs csatolt adatlap</span>
            )}
            <button
              type="button"
              disabled={uploadingPdf || saving}
              onClick={() => pdfInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--pier-border)",
                borderRadius: "var(--rsm)",
                color: "var(--ink2)",
                cursor: uploadingPdf || saving ? "not-allowed" : "pointer",
                opacity: uploadingPdf || saving ? 0.6 : 1,
              }}
            >
              {uploadingPdf ? "Feltöltés..." : data.pdfUrl ? "Csere" : "PDF feltöltése"}
            </button>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 text-sm" style={{ background: "var(--red-bg)", border: "1px solid #f0b8b8", borderRadius: "var(--rsm)", color: "var(--red)" }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || uploadingPdf}
            className="flex-1 py-2 text-sm font-semibold transition-all"
            style={{
              background: saving || uploadingPdf ? "var(--pier-border2)" : "var(--pier-accent)",
              color: "#fff",
              borderRadius: "var(--rsm)",
              border: "none",
              cursor: saving || uploadingPdf ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Mentés..." : "Mentés"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium transition-all"
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--pier-border)",
              borderRadius: "var(--rsm)",
              color: "var(--ink2)",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            Mégse
          </button>
        </div>
      </div>
    </div>
  );
}
