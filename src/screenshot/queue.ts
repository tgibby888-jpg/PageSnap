import {
  takeScreenshot,
  type ScreenshotOptions,
  type ScreenshotResult,
} from "./index";

interface QueueItem {
  options: ScreenshotOptions;
  resolve: (value: ScreenshotResult) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const MAX_CONCURRENT = 2;
const TOTAL_TIMEOUT_MS = 60_000;

let activeCount = 0;
const pending: QueueItem[] = [];

function processQueue(): void {
  while (activeCount < MAX_CONCURRENT && pending.length > 0) {
    const item = pending.shift()!;
    activeCount++;

    // Cancel the queue-wait timeout — we're now processing
    clearTimeout(item.timer);

    const captureTimer = setTimeout(() => {
      item.reject(new Error("Screenshot capture timed out"));
    }, TOTAL_TIMEOUT_MS);

    takeScreenshot(item.options)
      .then((result) => {
        clearTimeout(captureTimer);
        item.resolve(result);
      })
      .catch((err) => {
        clearTimeout(captureTimer);
        item.reject(
          err instanceof Error ? err : new Error(String(err))
        );
      })
      .finally(() => {
        activeCount--;
        processQueue();
      });
  }
}

export function enqueueScreenshot(
  options: ScreenshotOptions
): Promise<ScreenshotResult> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      // Remove from queue if still pending (not yet being processed)
      const idx = pending.findIndex((i) => i.timer === timer);
      if (idx !== -1) {
        pending.splice(idx, 1);
        reject(new Error("Screenshot request timed out while queued"));
      }
      // If the item is no longer in the queue it's being processed —
      // the capture timer will handle its timeout.
    }, TOTAL_TIMEOUT_MS);

    pending.push({ options, resolve, reject, timer });
    processQueue();
  });
}
