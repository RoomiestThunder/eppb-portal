// Standalone outbox consumer — the production equivalent of a Kafka consumer group.
// Run alongside the web process: `npm run worker`. Polls for pending OutboxEvent rows
// and processes them; in production, swap this loop for a real broker subscription
// without changing anything else in the app (see src/lib/outbox.ts).
import { processPendingOutboxEvents } from "../src/lib/outbox";

const POLL_INTERVAL_MS = 5000;

async function loop() {
  for (;;) {
    try {
      const result = await processPendingOutboxEvents();
      if (result.processed > 0 || result.failed > 0) {
        console.log(`[worker] processed=${result.processed} failed=${result.failed}`);
      }
    } catch (err) {
      console.error("[worker] error draining outbox:", err);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

loop();
