import { NextRequest, NextResponse } from "next/server";
import { downloadFromGcs } from "@/app/lib/gcs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;
    const objectName = decodeURIComponent(filename);
    const { data, contentType } = await downloadFromGcs(objectName);

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${objectName.replace(/^\d+_/, "")}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("PDF letöltési hiba:", error);
    return NextResponse.json({ error: "Nem található." }, { status: 404 });
  }
}
