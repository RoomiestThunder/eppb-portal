import { NextResponse } from "next/server";
import { getMetricsRegistry } from "@/lib/metrics";

// Prometheus scrape endpoint. Point a Prometheus `scrape_config` at this path; Grafana then reads
// from Prometheus as usual. No auth here deliberately — in production this should be restricted to
// the cluster-internal network (NetworkPolicy / not exposed on the public ingress), not exposed the
// way the rest of the app is.
export async function GET() {
  const registry = getMetricsRegistry();
  const body = await registry.metrics();
  return new NextResponse(body, { headers: { "Content-Type": registry.contentType } });
}
