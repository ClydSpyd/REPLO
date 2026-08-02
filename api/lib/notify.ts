import { Resend } from "resend";

/**
 * Owner-facing notifications (email to the app owner when something noteworthy
 * happens). Kept behind one `notifyOwner` function so callers never touch the
 * transport — swap Resend for another provider here without changing controllers.
 *
 * Delivery is best-effort: callers should fire-and-forget and never let a
 * notifier outage block or fail the user's request.
 */

/** A signup worth telling the owner about. Add more variants as needed. */
export type OwnerEvent = {
  type: "signup";
  email: string;
  username: string;
};

// Sender: verified-domain address in production, Resend's shared test sender
// otherwise (only delivers to your own Resend account email in test mode).
const FROM_EMAIL = process.env.NOTIFY_FROM_EMAIL || "Replo <onboarding@resend.dev>";

// Lazily created so an unset key simply disables notifications (e.g. local dev)
// instead of throwing at import time.
let client: Resend | null = null;
function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Resend(apiKey);
  return client;
}

function render(event: OwnerEvent): { subject: string; html: string } {
  switch (event.type) {
    case "signup":
      return {
        subject: `🎉 New Replo signup: ${event.username}`,
        html: `
          <h2>New signup</h2>
          <p><strong>Username:</strong> ${event.username}</p>
          <p><strong>Email:</strong> ${event.email}</p>
          <p style="color:#888">${new Date().toISOString()}</p>
        `,
      };
  }
}

/**
 * Email the app owner about `event`. Resolves silently (no-op) when
 * RESEND_API_KEY or OWNER_EMAIL is unset. Rejects only on an actual send
 * failure — callers should `.catch` and never await this on the request path.
 */
export async function notifyOwner(event: OwnerEvent): Promise<void> {
  const resend = getClient();
  const to = process.env.OWNER_EMAIL;
  if (!resend || !to) return; // notifications disabled — nothing configured

  const { subject, html } = render(event);
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  // Resend returns errors in the response body rather than throwing.
  if (error) throw new Error(`Resend send failed: ${error.message}`);
}
