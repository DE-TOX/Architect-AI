const RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < RETRIES) {
        const backoff = 500 * 2 ** (attempt - 1);
        await sleep(backoff);
      }
    }
  }
  throw new Error(`${label} failed after ${RETRIES} attempts: ${String(lastErr)}`);
}

export const DEFAULT_MAX_TOKENS = 4096;
