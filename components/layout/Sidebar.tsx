"use client";

import Image from "next/image";

export default function Sidebar() {
  return (
    <aside
      style={{ background: "var(--pier-accent-dk)", width: 220, minWidth: 220 }}
      className="flex flex-col h-screen sticky top-0 z-20"
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <Image
          src="/pier-logo.png"
          alt="PIER Technical"
          width={140}
          height={40}
          style={{ objectFit: "contain" }}
          priority
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem icon="📦" label="Anyagadatbázis" active />
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
          PIER Technical © 2025
        </p>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <button
      className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all text-sm"
      style={{
        background: active ? "rgba(255,255,255,0.12)" : "transparent",
        color: active ? "#ffffff" : "rgba(255,255,255,0.6)",
        fontWeight: active ? 500 : 400,
        borderRadius: "var(--rsm)",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
