import { NextRequest, NextResponse } from "next/server";
import { suggestServiceStructure } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { description } = (await req.json()) as { description: string };
  if (!description || !description.trim()) {
    return NextResponse.json({ error: "description required" }, { status: 400 });
  }
  const draft = suggestServiceStructure(description);
  return NextResponse.json({ draft });
}
