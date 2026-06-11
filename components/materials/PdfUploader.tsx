"use client";

import { useState, useRef, useCallback } from "react";
import type { Material } from "@/app/lib/types";

type ExtractedData = Omit<Material, "itemId" | "feltoltve">;
type Step = "idle" | "parsing" | "review" | "saving" | "done" | "error";

interface Props {
  onSaved?: () => void;
}

const FIELD_LABELS: Partial<Record<keyof ExtractedData, string>> = {
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

export default function PdfUploader({ onSaved }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [data, setData] = useState<Partial<ExtractedData>>({});
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setErrorMsg("Csak PDF fájl tölthető fel.");
      setStep("error");
      return;
    }
    setFileName(file.name);
    setStep("parsing");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ismeretlen hiba");
      setData({ statusz: "Jóváhagyásra vár", ...json.data, pdfUrl: json.pdfUrl ?? "" });
      setStep("review");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Hiba történt.");
      setStep("error");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSave = async () => {
    setStep("saving");
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Mentési hiba");
      setStep("done");
      onSaved?.();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Mentési hiba.");
      setStep("error");
    }
  };

  const reset = () => { setStep("idle"); setData({}); setFileName(""); setErrorMsg(""); };

  if (step === "idle" || step === "error") {
    return (
      <div className="space-y-3">
        <div
          className="p-10 text-center cursor-pointer transition-all"
          style={{
            border: `2px dashed ${dragging ? "var(--pier-accent)" : "var(--pier-border)"}`,
            borderRadius: "var(--rlg)",
            background: dragging ? "var(--pier-accent-bg)" : "var(--surface2)",
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="text-3xl mb-3">📄</div>
          <p className="font-medium text-sm" style={{ color: "var(--ink)" }}>Húzd ide a TDS PDF-et, vagy kattints a feltöltéshez</p>
          <p className="text-xs mt-1" style={{ color: "var(--ink3)" }}>Max. 10 MB · PDF formátum</p>
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
        {step === "error" && (
          <div className="p-3 text-sm" style={{ background: "var(--red-bg)", border: "1px solid #f0b8b8", borderRadius: "var(--rsm)", color: "var(--red)" }}>
            {errorMsg}
          </div>
        )}
      </div>
    );
  }

  if (step === "parsing") {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-4" style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</div>
        <p className="font-medium text-sm" style={{ color: "var(--ink)" }}>Claude AI elemzi az adatlapot…</p>
        <p className="text-xs mt-1" style={{ color: "var(--ink3)" }}>{fileName}</p>
      </div>
    );
  }

  if (step === "saving") {
    return (
      <div className="text-center py-12">
        <p className="font-medium text-sm" style={{ color: "var(--ink)" }}>Mentés folyamatban…</p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-3">✅</div>
        <p className="font-medium text-sm" style={{ color: "var(--ink)" }}>Sikeresen mentve!</p>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 text-sm font-medium"
          style={{
            background: "var(--pier-accent)",
            color: "#fff",
            borderRadius: "var(--rsm)",
            border: "none",
            cursor: "pointer",
          }}
        >
          Új anyag feltöltése
        </button>
      </div>
    );
  }

  // review step
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--ink2)" }}>Kinyert adatok ellenőrzése</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--ink3)" }}>{fileName}</p>
        </div>
        <button
          onClick={reset}
          className="px-3 py-1.5 text-xs font-medium"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--pier-border)",
            borderRadius: "var(--rsm)",
            color: "var(--ink2)",
            cursor: "pointer",
          }}
        >
          Mégsem
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(Object.keys(FIELD_LABELS) as (keyof ExtractedData)[]).map((key) => (
          <div key={key}>
            <label className="block text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "var(--ink2)" }}>
              {FIELD_LABELS[key]}
            </label>
            <input
              value={(data[key] as string | number) ?? ""}
              onChange={(e) => {
                const val = NUMBER_FIELDS.has(key)
                  ? e.target.value === "" ? null : Number(e.target.value)
                  : e.target.value;
                setData((prev) => ({ ...prev, [key]: val }));
              }}
              type={NUMBER_FIELDS.has(key) ? "number" : "text"}
              placeholder={`${FIELD_LABELS[key]}…`}
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = "var(--pier-accent)")}
              onBlur={e => (e.target.style.borderColor = "var(--pier-border)")}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          className="flex-1 py-2 text-sm font-semibold"
          style={{
            background: "var(--pier-accent)",
            color: "#fff",
            borderRadius: "var(--rsm)",
            border: "none",
            cursor: "pointer",
          }}
        >
          Mentés a Sheet-be
        </button>
        <button
          onClick={reset}
          className="px-5 py-2 text-sm font-medium"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--pier-border)",
            borderRadius: "var(--rsm)",
            color: "var(--ink2)",
            cursor: "pointer",
          }}
        >
          Eldobás
        </button>
      </div>
    </div>
  );
}
