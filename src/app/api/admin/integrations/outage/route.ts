import { NextRequest, NextResponse } from "next/server";
import { getSession, WRITE_ROLES } from "@/lib/session";
import { setSimulatedOutage, getSimulatedOutages, getBreakerStates } from "@/lib/circuitBreaker";

// Demo/ops control: flip a connector "down" to see retry → circuit-open → degraded-submission
// behavior actually happen, instead of just reading about it.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !WRITE_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { connector, down } = (await req.json()) as { connector: string; down: boolean };
  setSimulatedOutage(connector, down);
  return NextResponse.json({ outages: getSimulatedOutages(), breakers: getBreakerStates() });
}

export async function GET() {
  return NextResponse.json({ outages: getSimulatedOutages(), breakers: getBreakerStates() });
}
