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
    let parentAbortHandler: (() => void) | null = null;

    // If caller passed a signal, forward its abort to our controller so caller can cancel
    if (init && (init as any).signal) {
      const parentSignal = (init as any).signal as AbortSignal;
      if (parentSignal.aborted) {
        // Abort the child controller without passing the parent reason to avoid
        // runtime errors in environments that don't support abort reasons.
        try {
          controller.abort();
        } catch (e) {
          console.warn("fetchWithRetry: controller.abort() threw during immediate abort:", e);
        }
      } else {
        parentAbortHandler = () => {
          try {
            controller.abort();
          } catch (e) {
            console.warn("fetchWithRetry: controller.abort() threw in parent handler:", e);
          }
        };
        parentSignal.addEventListener("abort", parentAbortHandler);
      }
    }

    const id = setTimeout(() => {
      try {
        controller.abort();
      } catch (e) {
        console.warn("fetchWithRetry: controller.abort() threw on timeout:", e);
      }
    }, timeout);

    try {
      const res = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(id);
      if (parentAbortHandler && (init as any).signal) {
        try {
          (init as any).signal.removeEventListener("abort", parentAbortHandler);
        } catch (e) {
          /* ignore */
        }
      }
      return res;
    } catch (err: any) {
      clearTimeout(id);
      if (parentAbortHandler && (init as any).signal) {
        try {
          (init as any).signal.removeEventListener("abort", parentAbortHandler);
        } catch (e) {
          /* ignore */
        }
      }

      // If last attempt, throw a clearer error for aborts/timeouts
      if (attempt === retries) {
        if (err && err.name === "AbortError") {
          const abortErr = new Error("Request aborted or timed out");
          abortErr.name = "AbortError";
          throw abortErr;
        }
        // If the thrown error is an AbortError from fetch, normalize its name
        if (err && err.name === "AbortError") {
          const abortErr = new Error("Request aborted or timed out");
          abortErr.name = "AbortError";
          throw abortErr;
        }
        throw err;
      }

      // Wait with backoff then retry
      await new Promise((r) => setTimeout(r, backoff(attempt)));
      attempt += 1;
    }
  }

  // Shouldn't get here
  throw new Error("Failed to fetch after retries");
}
