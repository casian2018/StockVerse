interface EmailPayload {
  to: string[];
  subject: string;
  text: string;
  html?: string;
}

const RESEND_API_URL = "https://api.resend.com/emails";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

export async function sendAutomationEmail({
  to,
  subject,
  text,
  html,
}: EmailPayload): Promise<boolean> {
  if (!to.length) {
    return false;
  }

  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    console.warn(
      "[automations] Missing RESEND_API_KEY or RESEND_FROM_EMAIL – email skipped"
    );
    return false;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to,
        subject,
        text,
        html: html ?? `<p>${text}</p>`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[automations] Unable to send email:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[automations] Email send failed:", error);
    return false;
  }
}
