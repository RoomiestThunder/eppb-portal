import { NextResponse } from "next/server";
import { getSession, WRITE_ROLES } from "@/lib/session";
import { processPendingOutboxEvents } from "@/lib/outbox";

// Manual drain of the outbox — stands in for what a running consumer worker (scripts/worker.ts,
// or a real Kafka consumer in production) would do continuously in the background. Exposed here
// so the async BPM handoff is demonstrable in a live demo without a separate long-running process.
export async function POST() {
  const session = await getSession();
  if (!session || !WRITE_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const result = await processPendingOutboxEvents();
  return NextResponse.json(result);
}
