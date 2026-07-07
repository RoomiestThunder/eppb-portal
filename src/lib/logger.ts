// Minimal structured (JSON-lines) logger — the shape an ELK/OpenSearch/Loki pipeline expects to
// ingest without a custom parser, unlike free-form console.log strings. Deliberately dependency-free
// (no pino/winston) since the MVP doesn't need log shipping configured; swapping the implementation
// of log() for a real logging library later doesn't require touching any call site.
type Level = "info" | "warn" | "error";

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...meta });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
};
