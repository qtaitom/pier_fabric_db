import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { uploadToGcs } from "@/app/lib/gcs";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Te egy szövetanyag-adatlap elemző vagy.
A felhasználó egy TDS (Technical Data Sheet) PDF-et küld, amely szövetanyag műszaki adatait tartalmazza.
Kinyered a releváns adatokat és JSON formátumban adod vissza.
Csak a ténylegesen szereplő adatokat add vissza, ne találj ki semmit.
Ha egy mező nem található, hagyd üresen ("" vagy null).
A számokat számként add vissza (egység nélkül).`;

const USER_PROMPT = `Kérlek elemezd ezt a szövetanyag adatlapot és nyerd ki az alábbi mezőket JSON formátumban:

{
  "szallitoiCikkszam": "cikkszám vagy termékszám / megnevezés",
  "anyagtipus": "pl. Pamutvászon, Jersey, Fleece, Softshell, stb.",
  "szallito": "gyártó vagy szállító neve",
  "teljesSzelesseg": 150,
  "hasznoszelesseg": 145,
  "suly": 280,
  "osszetétel": "pl. 100% pamut, vagy 80% poliészter 20% pamut",
  "ar": "ár és devizanem, pl. 4.50 EUR/m",
  "fuvarparitas": "pl. FOB, CIF, EXW stb.",
  "sampleMoq": "minta minimális rendelési mennyiség, pl. 10m",
  "bulkMoq": "tömeges minimális rendelési mennyiség, pl. 500m",
  "gyartasiIdo": "gyártási idő, pl. 45 nap",
  "htsCode": "HTS / vámtarifaszám"
}

Csak a JSON objektumot add vissza, semmi mást.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) return NextResponse.json({ error: "Nincs PDF fájl." }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Csak PDF fogadható el." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Max. 10 MB." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    const [message, objectName] = await Promise.all([
      client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
            { type: "text", text: USER_PROMPT },
          ],
        }],
      }),
      uploadToGcs(buffer, file.name),
    ]);

    const pdfUrl = `/api/pdf/${encodeURIComponent(objectName)}`;
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Nem sikerült adatot kinyerni." }, { status: 422 });

    return NextResponse.json({ data: JSON.parse(jsonMatch[0]), pdfUrl });
  } catch (error) {
    console.error("PDF elemzési hiba:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
