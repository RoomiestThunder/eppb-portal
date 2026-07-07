// Generic retry + circuit breaker wrapper for the mock integration layer.
// State is in-memory per connector (fine for a single-instance MVP process; a multi-instance
// deployment would move this to a shared store, e.g. Redis, so all replicas agree on breaker state).

type BreakerState = "closed" | "open" | "half-open";

type BreakerRecord = {
  state: BreakerState;
  failureCount: number;
  openedAt: number;
};

const FAILURE_THRESHOLD = 3;
const RESET_TIMEOUT_MS = 15_000; // after this long "open", allow one probe request (half-open)

const breakers = new Map<string, BreakerRecord>();
const simulatedOutages = new Set<string>();

function getBreaker(connector: string): BreakerRecord {
  let b = breakers.get(connector);
  if (!b) {
    b = { state: "closed", failureCount: 0, openedAt: 0 };
    breakers.set(connector, b);
  }
  return b;
}

export class CircuitOpenError extends Error {
  constructor(connector: string) {
    super(`Коннектор «${connector}» временно отключен (circuit breaker open)`);
    this.name = "CircuitOpenError";
  }
}

export function getBreakerStates(): Record<string, BreakerState> {
  const out: Record<string, BreakerState> = {};
  for (const [connector, b] of breakers) out[connector] = b.state;
  return out;
}

// Demo/ops toggle: simulate a connector being down, to show retry+breaker+degradation live.
export function setSimulatedOutage(connector: string, down: boolean) {
  if (down) simulatedOutages.add(connector);
  else simulatedOutages.delete(connector);
}

export function getSimulatedOutages(): string[] {
  return Array.from(simulatedOutages);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withResilience<T>(connector: string, fn: () => Promise<T>, opts: { retries?: number; baseDelayMs?: number } = {}): Promise<T> {
  const breaker = getBreaker(connector);
  const retries = opts.retries ?? 2;
  const baseDelay = opts.baseDelayMs ?? 150;

  if (breaker.state === "open") {
    if (Date.now() - breaker.openedAt > RESET_TIMEOUT_MS) {
      breaker.state = "half-open";
    } else {
      throw new CircuitOpenError(connector);
    }
  }

  const attempts = breaker.state === "half-open" ? 1 : retries + 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      if (simulatedOutages.has(connector)) throw new Error(`Симулированный сбой коннектора «${connector}»`);
      const result = await fn();
      breaker.failureCount = 0;
      breaker.state = "closed";
      return result;
    } catch (err) {
      lastError = err;
      breaker.failureCount++;
      if (breaker.state === "half-open" || breaker.failureCount >= FAILURE_THRESHOLD) {
        breaker.state = "open";
        breaker.openedAt = Date.now();
        break;
      }
      if (attempt < attempts - 1) await sleep(baseDelay * 2 ** attempt);
    }
  }
  throw lastError;
}
