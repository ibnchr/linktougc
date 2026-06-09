import { NextRequest, NextResponse } from "next/server";
import { getOutput } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const output = getOutput(id);

    if (!output) {
      return NextResponse.json(
        { success: false, error: "Hasil tidak ditemukan atau sudah kadaluarsa." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, output });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Gagal memuat hasil." },
      { status: 500 }
    );
  }
}
