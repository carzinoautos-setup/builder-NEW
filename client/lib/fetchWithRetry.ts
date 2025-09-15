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
        // Schedule async abort to avoid throwing synchronously in some environments
        setTimeout(() => {
          try {
            controller.abort();
          } catch (e) {
            console.warn(
              "fetchWithRetry: controller.abort() threw during immediate abort:",
              e,
            );
          }
        }, 0);
      } else {
        parentAbortHandler = () => {
          // Abort asynchronously to prevent event-handler synchronous exceptions
          setTimeout(() => {
            try {
              controller.abort();
            } catch (e) {
              console.warn(
                "fetchWithRetry: controller.abort() threw in parent handler:",
                e,
              );
            }
          }, 0);
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

      // If this is an AbortError, return a graceful response-like object immediately
      if (
        err &&
        (err.name === "AbortError" ||
          String(err.message || "")
            .toLowerCase()
            .includes("aborted"))
      ) {
        const msg = "Request aborted";
        console.warn(
          "fetchWithRetry: request aborted",
          err && err.message ? err.message : "",
        );
        return {
          ok: false,
          status: 0,
          statusText: msg,
          json: async () => ({ success: false, message: msg }),
          text: async () => msg,
        } as any;
      }

      // If this looks like a network-level failure for a relative path, try absolute origin once
      const isNetworkError =
        err && (err.message === "Failed to fetch" || err.name === "TypeError");
      if (
        isNetworkError &&
        typeof input === "string" &&
        input.startsWith("/") &&
        attempt < retries
      ) {
        // Try a sequence of absolute fallbacks to handle embedded environments (preview iframes, proxies)
        const candidates: string[] = [window.location.origin];
        try {
          if (
            typeof import.meta !== "undefined" &&
            (import.meta as any).env &&
            (import.meta as any).env.VITE_WP_URL
          ) {
            const envBase = String(
              (import.meta as any).env.VITE_WP_URL,
            ).replace(/\/$/, "");
            // Only add if different
            if (envBase && envBase !== window.location.origin)
              candidates.push(envBase);
          }
        } catch (e) {
          /* ignore env read errors */
        }

        for (const base of candidates) {
          try {
            const absolute = base + input;
            // small backoff before trying absolute
            await new Promise((r) => setTimeout(r, 200));
            const res2 = await fetch(absolute, {
              ...init,
              signal: controller.signal,
            });
            if (res2) return res2;
          } catch (e) {
            console.warn(
              "fetchWithRetry: absolute origin retry failed for base",
              base,
              e,
            );
            // try next candidate
          }
        }
      }

      // If last attempt, do not throw raw network errors that bubble as unhandled rejections
      if (attempt === retries) {
        // Normalize abort errors
        if (err && err.name === "AbortError") {
          const abortErr = new Error("Request aborted or timed out");
          abortErr.name = "AbortError";
          // Return a graceful response-like object so callers can handle failures
          console.warn("fetchWithRetry: final abort/timeout", abortErr.message);
          return {
            ok: false,
            status: 0,
            statusText: abortErr.message,
            json: async () => ({ success: false, message: abortErr.message }),
            text: async () => abortErr.message,
          } as any;
        }

        // For other network-level errors, return a graceful response object instead of throwing
        console.warn(
          "fetchWithRetry: final network error",
          err && err.message ? err.message : err,
        );
        return {
          ok: false,
          status: 0,
          statusText: err && err.message ? err.message : "Network error",
          json: async () => ({
            success: false,
            message: err && err.message ? err.message : "Network error",
          }),
          text: async () =>
            err && err.message ? String(err.message) : "Network error",
        } as any;
      }

      // Wait with backoff then retry
      await new Promise((r) => setTimeout(r, backoff(attempt)));
      attempt += 1;
    }
  }

  // Shouldn't get here - return a graceful failure
  return {
    ok: false,
    status: 0,
    statusText: "Failed to fetch after retries",
    json: async () => ({
      success: false,
      message: "Failed to fetch after retries",
    }),
    text: async () => "Failed to fetch after retries",
  } as any;
}
