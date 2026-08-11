/**
 * Small shared helpers for tool handlers: uniform JSON results and graceful
 * error surfacing. Returning `isError: true` lets the *model* see what went
 * wrong (and possibly recover) instead of the transport throwing a raw fault.
 */
import { ReploError } from "../upstream/reploClient.js";

export function jsonContent(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function toolError(err: unknown) {
  const msg =
    err instanceof ReploError
      ? `REPLO API error ${err.status}: ${err.message}`
      : err instanceof Error
        ? err.message
        : String(err);
  return {
    content: [{ type: "text" as const, text: msg }],
    isError: true as const,
  };
}
