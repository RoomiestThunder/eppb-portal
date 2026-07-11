// Standalone outbox consumer — the production equivalent of a Kafka consumer group.
// Run alongside the web process: `npm run worker`. Polls for pending OutboxEvent rows
// and processes them; in production, swap this loop for a real broker subscription
// without changing anything else in the app (see src/lib/outbox.ts).
import "dotenv/config";
import { processPendingOutboxEvents } from "../src/lib/outbox";
import { logger } from "../src/lib/logger";

const POLL_INTERVAL_MS = 5000;

async function loop() {
  for (;;) {
    try {
      const result = await processPendingOutboxEvents();
      if (result.processed > 0 || result.failed > 0) {
        logger.info("outbox drain tick", result);
      }
    } catch (err) {
      logger.error("outbox drain failed", { error: err instanceof Error ? err.message : String(err) });
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

loop();
