import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Readiness probe: "can this instance actually serve traffic right now" — checks the one hard
// dependency the app has (the database). A Kubernetes readinessProbe hitting this pulls the pod
// out of the load-balancer rotation on failure without restarting it, giving the DB time to
// recover instead of causing a crash-loop.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ready" });
  } catch (err) {
    return NextResponse.json({ status: "not_ready", error: err instanceof Error ? err.message : String(err) }, { status: 503 });
  }
}
