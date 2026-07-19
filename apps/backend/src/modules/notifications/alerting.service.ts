import { Resend } from 'resend';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

const resend = new Resend(env.RESEND_API_KEY);

// Dedicated ops-alert channel, distinct from customer-facing notifications.
// Failures here should never throw back into the caller — an alert that
// fails to send must not also crash the webhook handler that triggered it.
export const alertingService = {
  async sendOpsAlert(subject: string, details: Record<string, unknown>): Promise<void> {
    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: env.ADMIN_ALERT_EMAIL,
        subject: `[Divye Alert] ${subject}`,
        html: `
          <h2>${subject}</h2>
          <pre>${JSON.stringify(details, null, 2)}</pre>
          <p>Triggered at ${new Date().toISOString()}</p>
        `,
      });
    } catch (err) {
      // Last-resort: if the alert email itself fails, at minimum this must
      // still surface in logs — don't let a Resend outage make the
      // underlying issue (e.g. stuck refund) invisible entirely.
      logger.error('Failed to send ops alert email', { subject, details, err });
    }
  },
};