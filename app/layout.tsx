import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PIER Anyagadatbázis",
  description: "PIER Technical — szövetanyagok nyilvántartása",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body>
        <a
          href="https://pier-inditopult.netlify.app"
          title="Vissza az indítópultra"
          style={{
            position: "fixed",
            top: "12px",
            right: "12px",
            zIndex: 9999,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "999px",
            background: "#1e293b",
            color: "#f1f5f9",
            border: "1px solid #334155",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
            fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
            boxShadow: "0 4px 14px -4px rgba(0,0,0,.45)",
          }}
        >
          🏠 Indítópult
        </a>
        {children}
      </body>
    </html>
  );
}
