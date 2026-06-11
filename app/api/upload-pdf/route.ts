import { NextRequest, NextResponse } from "next/server";
import { uploadToGcs } from "@/app/lib/gcs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) return NextResponse.json({ error: "Nincs fájl." }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Csak PDF fogadható el." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Max. 10 MB." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const objectName = await uploadToGcs(buffer, file.name);
    const pdfUrl = `/api/pdf/${encodeURIComponent(objectName)}`;

    return NextResponse.json({ pdfUrl });
  } catch (error) {
    console.error("PDF feltöltési hiba:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
