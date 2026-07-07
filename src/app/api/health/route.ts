import { NextResponse } from "next/server";

// Liveness probe: "is the process up and able to respond at all" — deliberately checks nothing
// external (no DB, no integrations). A Kubernetes livenessProbe hitting this restarts the pod if
// it stops responding; it should NOT restart the pod just because the database is briefly down —
// that's what /api/ready (readinessProbe) is for.
export async function GET() {
  return NextResponse.json({ status: "ok", uptimeSeconds: Math.round(process.uptime()) });
}
