/**
 * Feed fetching.
 *
 * Shared by the adapters so every publisher sees the same headers, redirect
 * behaviour and timeout. The body is read as text and handed to a parser; the
 * response is never interpreted by content type, because publishers mislabel
 * their own feeds.
 */

export interface FetchXmlOptions {
  /** Sent as the `User-Agent`; several publishers reject unknown clients. */
  userAgent: string;
  /** Abort the request after this long. */
  timeoutMs: number;
  /** `Accept` header, widened per adapter. */
  accept: string;
}

/** Fetch a feed as text, or throw with the status when it cannot be read. */
export async function fetchXml(
  url: string,
  options: FetchXmlOptions
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': options.userAgent,
        accept: options.accept,
      },
    });

    if (!response.ok) {
      throw new Error(`responded ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}
