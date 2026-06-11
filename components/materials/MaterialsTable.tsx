"use client";

import { useState, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import EditModal from "./EditModal";
import type { Material } from "@/app/lib/types";

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  "Jóváhagyva":       { bg: "var(--green-bg)",    color: "var(--green)",       border: "var(--green-border)" },
  "Jóváhagyásra vár": { bg: "var(--orange-bg)",   color: "var(--orange)",      border: "var(--orange-border)" },
  "Felhasználva":     { bg: "var(--pier-accent-bg)", color: "var(--pier-accent)", border: "#b8d0e8" },
  "Archivált":        { bg: "var(--surface2)",     color: "var(--ink3)",        border: "var(--pier-border)" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES["Archivált"];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: "var(--rsm)" }}
    >
      {status}
    </span>
  );
}

function fmt(n: number | null, unit = "cm") {
  return n === null ? "—" : `${n} ${unit}`;
}

const ALL = "__all__";

interface Props {
  materials: Material[];
  lastUpdated?: string;
}

export default function MaterialsTable({ materials: initialMaterials, lastUpdated }: Props) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [supplierFilter, setSupplierFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [editing, setEditing] = useState<Material | null>(null);

  const types     = useMemo(() => [...new Set(materials.map((m) => m.anyagtipus).filter(Boolean))].sort(), [materials]);
  const suppliers = useMemo(() => [...new Set(materials.map((m) => m.szallito).filter(Boolean))].sort(), [materials]);
  const statuses  = useMemo(() => [...new Set(materials.map((m) => m.statusz).filter(Boolean))].sort(), [materials]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return materials.filter((m) => {
      if (q && !`${m.szallito} ${m.szallitoiCikkszam} ${m.osszetétel} ${m.itemId} ${m.htsCode}`.toLowerCase().includes(q)) return false;
      if (typeFilter !== ALL && m.anyagtipus !== typeFilter) return false;
      if (supplierFilter !== ALL && m.szallito !== supplierFilter) return false;
      if (statusFilter !== ALL && m.statusz !== statusFilter) return false;
      return true;
    });
  }, [materials, search, typeFilter, supplierFilter, statusFilter]);

  const handleSaved = (updated: Material) => {
    setMaterials((prev) => prev.map((m) => m.itemId === editing?.itemId ? updated : m));
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div
        className="flex flex-wrap items-center gap-2 p-3"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--pier-border)",
          borderRadius: "var(--rlg)",
        }}
      >
        <input
          placeholder="Keresés…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-sm outline-none"
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--pier-border)",
            borderRadius: "var(--rsm)",
            color: "var(--ink)",
            width: 220,
            transition: "border-color .15s",
          }}
          onFocus={e => (e.target.style.borderColor = "var(--pier-accent)")}
          onBlur={e => (e.target.style.borderColor = "var(--pier-border)")}
        />

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger
            className="h-8 text-sm"
            style={{ width: 160, borderRadius: "var(--rsm)", borderColor: "var(--pier-border)", background: "var(--surface2)", color: "var(--ink)" }}
          >
            <SelectValue placeholder="Típus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Minden típus</SelectItem>
            {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger
            className="h-8 text-sm"
            style={{ width: 170, borderRadius: "var(--rsm)", borderColor: "var(--pier-border)", background: "var(--surface2)", color: "var(--ink)" }}
          >
            <SelectValue placeholder="Beszállító" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Minden beszállító</SelectItem>
            {suppliers.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            className="h-8 text-sm"
            style={{ width: 175, borderRadius: "var(--rsm)", borderColor: "var(--pier-border)", background: "var(--surface2)", color: "var(--ink)" }}
          >
            <SelectValue placeholder="Státusz" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Minden státusz</SelectItem>
            {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-4">
          <span className="text-xs" style={{ color: "var(--ink3)" }}>{filtered.length} anyag</span>
          {lastUpdated && (
            <span className="text-xs" style={{ color: "var(--ink3)" }}>
              Frissítve: {new Date(lastUpdated).toLocaleString("hu-HU")}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-x-auto"
        style={{ background: "var(--surface)", border: "1px solid var(--pier-border)", borderRadius: "var(--rlg)" }}
      >
        <Table>
          <TableHeader>
            <TableRow style={{ background: "var(--surface2)", borderBottom: "1px solid var(--pier-border)" }}>
              {["ID","Cikkszám","Típus","Beszállító","Teljes sz.","Hasznos sz.","Súly","Összetétel","Ár","Fuvarparitás","Sample MOQ","BULK MOQ","Gyártási idő","HTS kód","Státusz","Adatlap",""].map((h, i) => (
                <TableHead
                  key={i}
                  className={`text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${i >= 4 && i <= 6 ? "text-right" : ""}`}
                  style={{ color: "var(--ink2)", padding: "10px 14px" }}
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={17} className="text-center py-12" style={{ color: "var(--ink3)" }}>
                  Nincs találat.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow
                  key={m.itemId}
                  style={{ borderBottom: "1px solid var(--pier-border)", transition: "background .1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <TableCell style={{ padding: "10px 14px" }}>
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--pier-accent-bg)", color: "var(--pier-accent)", fontFamily: "'DM Mono', monospace" }}>
                      {m.itemId}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono" style={{ padding: "10px 14px", color: "var(--ink2)" }}>{m.szallitoiCikkszam}</TableCell>
                  <TableCell className="text-sm" style={{ padding: "10px 14px" }}>{m.anyagtipus || "—"}</TableCell>
                  <TableCell className="text-sm font-medium" style={{ padding: "10px 14px", color: "var(--pier-accent)" }}>{m.szallito || "—"}</TableCell>
                  <TableCell className="text-right text-sm" style={{ padding: "10px 14px" }}>{fmt(m.teljesSzelesseg)}</TableCell>
                  <TableCell className="text-right text-sm" style={{ padding: "10px 14px" }}>{fmt(m.hasznoszelesseg)}</TableCell>
                  <TableCell className="text-right text-sm" style={{ padding: "10px 14px" }}>{fmt(m.suly, "g/m²")}</TableCell>
                  <TableCell className="text-xs" style={{ padding: "10px 14px", color: "var(--ink2)", maxWidth: 200 }}>{m.osszetétel || "—"}</TableCell>
                  <TableCell className="text-xs" style={{ padding: "10px 14px" }}>{m.ar || "—"}</TableCell>
                  <TableCell className="text-xs" style={{ padding: "10px 14px" }}>{m.fuvarparitas || "—"}</TableCell>
                  <TableCell className="text-xs" style={{ padding: "10px 14px" }}>{m.sampleMoq || "—"}</TableCell>
                  <TableCell className="text-xs" style={{ padding: "10px 14px" }}>{m.bulkMoq || "—"}</TableCell>
                  <TableCell className="text-xs" style={{ padding: "10px 14px" }}>{m.gyartasiIdo || "—"}</TableCell>
                  <TableCell className="font-mono text-xs" style={{ padding: "10px 14px", color: "var(--ink3)" }}>{m.htsCode || "—"}</TableCell>
                  <TableCell style={{ padding: "10px 14px" }}><StatusBadge status={m.statusz} /></TableCell>
                  <TableCell className="text-center" style={{ padding: "10px 14px" }}>
                    {m.pdfUrl ? (
                      <a
                        href={m.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
                        style={{ color: "var(--pier-accent)" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--pier-accent-lt)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--pier-accent)")}
                      >
                        PDF ↗
                      </a>
                    ) : (
                      <span style={{ color: "var(--pier-border2)" }}>—</span>
                    )}
                  </TableCell>
                  <TableCell style={{ padding: "10px 14px" }}>
                    <button
                      className="px-2.5 py-1 text-xs font-medium transition-all"
                      style={{
                        color: "var(--pier-accent)",
                        background: "var(--pier-accent-bg)",
                        border: "1px solid transparent",
                        borderRadius: "var(--rsm)",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--pier-accent)")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
                      onClick={() => setEditing(m)}
                    >
                      Szerkesztés
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <EditModal material={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
    </div>
  );
}
