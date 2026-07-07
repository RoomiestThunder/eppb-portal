import client from "prom-client";
import { prisma } from "@/lib/prisma";
import { getBreakerStates } from "@/lib/circuitBreaker";

// Prometheus metrics registry. globalThis-cached the same way prisma.ts caches its client —
// Next.js dev-mode HMR would otherwise re-register the same metric name on every edit and crash
// with "metric already registered".
const globalForMetrics = globalThis as unknown as { metricsRegistry?: client.Registry };

function buildRegistry() {
  const registry = new client.Registry();
  client.collectDefaultMetrics({ register: registry });

  const applicationsByStatus = new client.Gauge({
    name: "eppb_applications_by_status",
    help: "Number of applications currently in each status",
    labelNames: ["status"],
    registers: [registry],
    async collect() {
      const rows = await prisma.application.groupBy({ by: ["status"], _count: { _all: true } });
      for (const row of rows) this.set({ status: row.status }, row._count._all);
    },
  });

  const servicesPublished = new client.Gauge({
    name: "eppb_services_published_total",
    help: "Number of published services in the constructor",
    registers: [registry],
    async collect() {
      this.set(await prisma.service.count({ where: { status: "PUBLISHED" } }));
    },
  });

  const outboxPending = new client.Gauge({
    name: "eppb_outbox_pending_total",
    help: "Number of outbox events waiting to be processed (async BPM handoff backlog)",
    registers: [registry],
    async collect() {
      this.set(await prisma.outboxEvent.count({ where: { status: "pending" } }));
    },
  });

  const circuitBreakerState = new client.Gauge({
    name: "eppb_circuit_breaker_open",
    help: "1 if the connector's circuit breaker is open (failing), 0 otherwise",
    labelNames: ["connector"],
    registers: [registry],
    collect() {
      const states = getBreakerStates();
      for (const [connector, state] of Object.entries(states)) this.set({ connector }, state === "open" ? 1 : 0);
    },
  });

  void applicationsByStatus;
  void servicesPublished;
  void outboxPending;
  void circuitBreakerState;
  return registry;
}

export function getMetricsRegistry(): client.Registry {
  if (!globalForMetrics.metricsRegistry) globalForMetrics.metricsRegistry = buildRegistry();
  return globalForMetrics.metricsRegistry;
}
