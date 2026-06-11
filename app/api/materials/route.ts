import { NextRequest, NextResponse } from "next/server";
import { appendMaterial, fetchMaterials } from "@/app/lib/google-sheets";
import { revalidatePath } from "next/cache";
import type { ApiResponse } from "@/app/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchMaterials();
    const response: ApiResponse = {
      data,
      total: data.length,
      lastUpdated: new Date().toISOString(),
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Hiba az anyagok betöltésekor:", error);
    return NextResponse.json({ error: "Nem sikerült betölteni az anyagokat." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const itemId = await appendMaterial(body);
    revalidatePath("/");
    return NextResponse.json({ success: true, itemId });
  } catch (error) {
    console.error("Hiba mentéskor:", error);
    return NextResponse.json({ error: "Nem sikerült menteni az anyagot." }, { status: 500 });
  }
}
