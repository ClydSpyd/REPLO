import { randomBytes } from "node:crypto";

/** Opaque, unguessable identifier with a readable prefix (e.g. "rma_a1b2…"). */
export const newId = (prefix: string): string =>
  `${prefix}_${randomBytes(32).toString("hex")}`;
