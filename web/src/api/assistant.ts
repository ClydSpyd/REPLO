/**
 * Coach streaming client.
 *
 * Uses raw `fetch` rather than the shared axios client for two reasons:
 *  - axios can't expose a response body as a stream, and
 *  - the axios request interceptor (which attaches the bearer token) doesn't
 *    apply to fetch — so we set Authorization manually here.
 *
 * The server responds with Server-Sent Events. We read the ReadableStream,
 * split it into events on the blank-line delimiter, and dispatch each one.
 */

export interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface StreamHandlers {
  /** A text delta arrived. */
  onToken: (text: string) => void;
  /** The reply finished normally. */
  onDone: () => void;
  /** Something failed (network, auth, or an error event from the server). */
  onError: (message: string) => void;
}

export async function streamChat(
  messages: CoachMessage[],
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const token = localStorage.getItem('access_token');

  let response: Response;
  try {
    response = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (err) {
    handlers.onError(err instanceof Error ? err.message : 'Network error');
    return;
  }

  // A failure before streaming starts (401, 400, …) comes back as normal JSON.
  if (!response.ok || !response.body) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      /* no JSON body — keep the status-code message */
    }
    handlers.onError(message);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line ("\n\n").
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      dispatch(rawEvent, handlers);
    }
  }
}

/** Parse one raw SSE block ("event: …\ndata: …") and route it to a handler. */
function dispatch(raw: string, handlers: StreamHandlers): void {
  let event = 'message';
  let data = '';

  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }

  try {
    if (event === 'token') {
      handlers.onToken((JSON.parse(data) as { text: string }).text);
    } else if (event === 'done') {
      handlers.onDone();
    } else if (event === 'error') {
      handlers.onError((JSON.parse(data) as { message: string }).message);
    }
  } catch {
    handlers.onError('Malformed response from server');
  }
}
