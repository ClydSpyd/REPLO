import { z } from 'zod';

/** First error message per field, keyed by field name. */
export type FieldErrors = Record<string, string>;

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: FieldErrors };

/**
 * Parse `values` against `schema`, returning either the typed, parsed data or
 * a flat `{ field: firstMessage }` map ready to render under form inputs.
 *
 * Keeping this here means consumers (notably the web client) never import zod
 * directly — they get validation and errors through one shared helper.
 */
export function validate<S extends z.ZodType>(
  schema: S,
  values: unknown,
): ValidationResult<z.infer<S>> {
  const result = schema.safeParse(values);
  if (result.success) return { success: true, data: result.data };

  // With a generic ZodType the flattened shape widens to {}, so narrow it.
  const fieldErrors = z.flattenError(result.error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  const errors: FieldErrors = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages && messages.length > 0) errors[key] = messages[0];
  }
  return { success: false, errors };
}
