function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runWithRetries(task, processor, options = {}) {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 400;
  const maxDelayMs = options.maxDelayMs ?? 8000;
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await processor(task);
      return;
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts) break;
      const exp = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const jitter = Math.random() * 250;
      await sleep(exp + jitter);
    }
  }
  throw lastErr;
}
