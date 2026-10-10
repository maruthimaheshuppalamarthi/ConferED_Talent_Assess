import { authApi } from './authApi';

export interface DispatchedEmail {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  otpCode?: string;
  assessmentLink?: string;
  assessmentTitle?: string;
  durationMinutes?: number;
  expiresAt?: string;
  sentAt: string;
  status: 'Delivered' | 'Sent' | 'Delivering' | 'Failed';
  provider: string;
}

/**
 * Email log + staff-only test sender.
 *
 * OTP and invitation emails are generated and delivered by the backend (server-side OTPs), so the
 * browser never creates passcodes or holds SMTP credentials. This class only keeps a local activity
 * log for the "Dispatched Email Console" and can trigger an authenticated SMTP test email.
 */
export class EmailService {
  private static sentEmails: DispatchedEmail[] = [];

  /** Record an invitation that the server has already emailed. */
  public static recordInvite(
    recipientName: string,
    recipientEmail: string,
    assessmentLink: string,
    devOtp?: string | null,
    meta?: { assessmentTitle?: string; durationMinutes?: number; expiresAt?: string },
  ): DispatchedEmail {
    const title = meta?.assessmentTitle || 'Assessment';
    const mins = meta?.durationMinutes ?? 60;
    const entry: DispatchedEmail = {
      id: `email-${Date.now()}`,
      recipientEmail,
      recipientName,
      subject: `Invitation: ${title}`,
      bodyText: `Hello ${recipientName}, you have been invited to ${title} (${mins} min). Link: ${assessmentLink}`,
      bodyHtml: '',
      otpCode: devOtp || undefined,
      assessmentLink,
      assessmentTitle: title,
      durationMinutes: mins,
      expiresAt: meta?.expiresAt,
      sentAt: new Date().toLocaleString(),
      status: 'Delivered',
      provider: 'Gmail SMTP (server-side)',
    };
    this.sentEmails.unshift(entry);
    return entry;
  }

  /** Staff-only SMTP smoke test (requires a signed-in Recruiter or System Admin; enforced by the backend). */
  public static async sendTestEmail(recipientEmail: string): Promise<boolean> {
    const subject = 'NexusAssess SMTP test';
    const bodyHtml = '<p>This is a test email from the NexusAssess admin console.</p>';
    const entry: DispatchedEmail = {
      id: `email-${Date.now()}`,
      recipientEmail,
      recipientName: 'Admin',
      subject,
      bodyText: 'SMTP test email',
      bodyHtml,
      sentAt: new Date().toLocaleString(),
      status: 'Delivering',
      provider: 'Gmail SMTP (server-side)',
    };
    this.sentEmails.unshift(entry);

    try {
      const res = await authApi.fetchJson<{ status: string }>('/recruiter/send-email', 'POST', {
        recipientEmail,
        recipientName: 'Admin',
        subject,
        bodyHtml,
      });
      entry.status = res.status === 'success' ? 'Delivered' : 'Sent';
      return res.status === 'success';
    } catch {
      entry.status = 'Failed';
      return false;
    }
  }

  public static getSentEmails(): DispatchedEmail[] {
    return this.sentEmails;
  }
}
