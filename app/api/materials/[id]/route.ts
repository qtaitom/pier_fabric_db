import { NextRequest, NextResponse } from "next/server";
import { updateMaterial } from "@/app/lib/google-sheets";
import { revalidatePath } from "next/cache";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    await updateMaterial(id, body);
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Frissítési hiba:", error);
    return NextResponse.json({ error: "Nem sikerült frissíteni." }, { status: 500 });
  }
}
