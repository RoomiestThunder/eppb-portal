import { NextRequest, NextResponse } from "next/server";
import { mockIinBinCheck } from "@/lib/integrations";

export async function POST(req: NextRequest) {
  const { value } = (await req.json()) as { value: string };
  if (!value) return NextResponse.json({ error: "value required" }, { status: 400 });
  const result = await mockIinBinCheck(value);
  return NextResponse.json(result);
}
