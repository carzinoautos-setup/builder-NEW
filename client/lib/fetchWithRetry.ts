export async function fetchWithRetry(
  input: RequestInfo,
  init: RequestInit = {},
  retries = 2,
  timeout = 15000,
) {
  let attempt = 0;
  const backoff = (n: number) => Math.min(1000 * 2 ** n, 10000);

  while (attempt <= retries) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      // If last attempt, rethrow
      if (attempt === retries) throw err;
      // If aborted due to timeout or network failure, wait and retry
      await new Promise((r) => setTimeout(r, backoff(attempt)));
      attempt += 1;
    }
  }
  // Shouldn't get here
  throw new Error("Failed to fetch after retries");
}
