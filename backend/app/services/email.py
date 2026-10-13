import logging
import re
import smtplib
import socket
import ssl
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate, make_msgid
from html import escape, unescape
from typing import Optional, Tuple

from app.core.config import settings
from app.services import runtime_settings as rt

logger = logging.getLogger("nexus.email")

SMTP_TIMEOUT_SECONDS = 12


def _explain(exc: Exception) -> str:
    """A short, safe explanation for the admin (never includes the password or server banner text)."""
    if isinstance(exc, smtplib.SMTPAuthenticationError):
        return "The SMTP server rejected the sender address / password. For Gmail use a 16-character App Password."
    if isinstance(exc, smtplib.SMTPSenderRefused):
        return "The SMTP server refused the sender address."
    if isinstance(exc, smtplib.SMTPRecipientsRefused):
        return "The SMTP server refused the recipient address."
    if isinstance(exc, (socket.timeout, TimeoutError)):
        return "The SMTP server did not answer in time. Check the host and port."
    if isinstance(exc, socket.gaierror):
        return "The SMTP host name could not be found."
    if isinstance(exc, (ConnectionError, OSError, smtplib.SMTPConnectError, smtplib.SMTPServerDisconnected)):
        return "Could not connect to the SMTP server. Check the host and port."
    if isinstance(exc, ssl.SSLError):
        return "A secure (TLS) connection to the SMTP server could not be established."
    return "The email could not be sent (see the server log)."


def _open_session(host: str, port: int, sender: str, password: str) -> smtplib.SMTP:
    """Connect, secure the channel and sign in. The caller must quit() the returned session."""
    if port == 465:  # implicit TLS
        server = smtplib.SMTP_SSL(host, port, timeout=SMTP_TIMEOUT_SECONDS, context=ssl.create_default_context())
        server.ehlo()
    else:  # STARTTLS (587 / 25)
        server = smtplib.SMTP(host, port, timeout=SMTP_TIMEOUT_SECONDS)
        server.ehlo()
        server.starttls(context=ssl.create_default_context())
        server.ehlo()
    try:
        server.login(sender, password)
    except Exception:
        _quietly_quit(server)
        raise
    return server


def _quietly_quit(server: smtplib.SMTP) -> None:
    try:
        server.quit()
    except Exception:
        pass


def _plain_from_html(body_html: str) -> str:
    """A text alternative so mailbox filters do not drop an HTML-only invitation."""
    text = re.sub(r"(?is)<(script|style).*?>.*?</\1>", " ", body_html or "")
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?i)</p>|</tr>|</h\d>", "\n", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text)
    lines = [" ".join(line.split()) for line in text.splitlines()]
    return "\n".join(line for line in lines if line).strip()


def send_email_detailed(to_email: str, subject: str, body_html: str,
                        sender_email: Optional[str] = None, app_password: Optional[str] = None,
                        host: Optional[str] = None, port: Optional[int] = None,
                        copy_to: Optional[str] = None) -> Tuple[bool, str]:
    """
    Send an HTML email through the gateway configured by the System Admin (database, then .env fallback).
    Never raises. Returns (ok, message) where message is a safe explanation when ok is False.
    The message is sent only to to_email. copy_to is ignored so the recruiter mailbox
    is not used as the recipient.
    """
    del copy_to
    cfg = rt.email_config()
    sender = sender_email or cfg.sender_email
    password = (app_password or cfg.password or "").replace(" ", "")
    host = host or cfg.host
    port = port or cfg.port
    if not sender or not password:
        logger.warning("SMTP credentials missing - email to %s not sent", to_email)
        return False, "No sender address or SMTP password is configured (System Admin > Settings > Email)."

    recipient = (to_email or "").strip()
    # The form address is the only envelope recipient. A second copy to the
    # sender was keeping the message in the recruiter mailbox.
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = formataddr((cfg.sender_name, sender))
        msg["To"] = recipient
        msg["Reply-To"] = sender
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain=sender.split("@")[-1] if "@" in sender else None)
        msg.attach(MIMEText(_plain_from_html(body_html), "plain", "utf-8"))
        msg.attach(MIMEText(body_html, "html", "utf-8"))

        server = _open_session(host, port, sender, password)
        try:
            refused = server.sendmail(sender, [recipient], msg.as_string())
        finally:
            _quietly_quit(server)
        if refused:
            logger.error("Email delivery refused for %s", ", ".join(refused))
            return False, "The mail server refused the recipient address."
        logger.info("SMTP accepted invitation for %s", recipient)
        return True, f"Email accepted for {recipient}."
    except Exception as exc:  # network / auth problems must not break the API
        logger.error("Email delivery to %s failed: %s: %s", to_email, type(exc).__name__, exc)
        return False, _explain(exc)


def probe_gateway() -> Tuple[bool, str]:
    """Check the saved gateway (connect, TLS, sign in) WITHOUT sending anything. Never raises."""
    cfg = rt.email_config()
    password = (cfg.password or "").replace(" ", "")
    if not cfg.sender_email or not password:
        return False, "No sender address or SMTP password is configured (System Admin > Settings > Email)."
    try:
        _quietly_quit(_open_session(cfg.host, cfg.port, cfg.sender_email, password))
        return True, f"Connected to {cfg.host}:{cfg.port} and signed in as {cfg.sender_email}."
    except Exception as exc:
        logger.error("SMTP probe of %s:%s failed: %s: %s", cfg.host, cfg.port, type(exc).__name__, exc)
        return False, _explain(exc)

def send_email(to_email: str, subject: str, body_html: str,
               sender_email: Optional[str] = None, app_password: Optional[str] = None,
               host: Optional[str] = None, port: Optional[int] = None) -> bool:
    """Fire-and-forget variant: True on success, False on any failure. Never raises."""
    return send_email_detailed(to_email, subject, body_html, sender_email, app_password, host, port)[0]


def dispatch_otp_email(to_email: str, subject: str, body_html: str) -> None:
    """
    Queue a login OTP email without blocking the request worker.

    Starlette BackgroundTasks run SMTP on the same worker after the handler, which stalls every
    later sign-in while Gmail connects. When DEV_EXPOSE_OTP is on the code is already in the API
    response, so SMTP is skipped; otherwise it runs on a daemon thread.
    """
    if settings.DEV_EXPOSE_OTP:
        logger.info("DEV_EXPOSE_OTP: skipping SMTP OTP email to %s", to_email)
        return
    threading.Thread(
        target=send_email,
        args=(to_email, subject, body_html),
        daemon=True,
        name="otp-smtp",
    ).start()

# ----------------------------------------------------------------- templates
def _confered_footer_html() -> str:
    """Branded ConferEd email footer matching design specifications."""
    return """
        <!-- Automated Email Disclaimer Card -->
        <div style="background-color: #f0f7ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 16px 20px; margin-top: 26px; margin-bottom: 24px; color: #334155; font-size: 13px; line-height: 1.55;">
          This is an automated email from ConferEd Talent Assess. Please do not reply to this message. If you need assistance, please contact us through the ConferEd Support page.
        </div>

        <!-- Two Column Help and Website Links (no social links) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 26px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 14px;">
              <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;">
                NEED HELP?
              </div>
              <a href="mailto:partnerships@confered.com" style="color: #2563eb; font-size: 14px; font-weight: 600; text-decoration: none;">
                partnerships@confered.com
              </a>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 14px;">
              <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;">
                VISIT OUR WEBSITE
              </div>
              <a href="https://www.confered.com/" target="_blank" style="color: #2563eb; font-size: 14px; font-weight: 600; text-decoration: none;">
                https://www.confered.com/
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Blue Copyright Bottom Bar -->
    <tr>
      <td style="background-color: #0b3b8c; color: #ffffff; text-align: center; padding: 14px 20px; font-size: 13px; font-weight: 500; letter-spacing: 0.3px;">
        &copy; ConferEd. All rights reserved. 2026
      </td>
    </tr>
    """


def _confered_shell(inner_content: str) -> str:
    """Executive responsive container for ConferEd talent assessment emails."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);" cellpadding="0" cellspacing="0">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #0b3b8c 0%, #2563eb 100%);"></td>
          </tr>

          <!-- Header / Brand -->
          <tr>
            <td style="padding: 26px 36px 18px 36px; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 24px; font-weight: 800; color: #0b3b8c; letter-spacing: -0.5px;">Confer<span style="color: #2563eb;">Ed</span></span>
                    <span style="display: inline-block; font-size: 11px; font-weight: 700; color: #0284c7; background-color: #e0f2fe; padding: 3px 9px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px; margin-left: 10px; vertical-align: middle;">TALENT ASSESS</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 36px 8px 36px;">
              {inner_content}
          <!-- Footer -->
          {_confered_footer_html()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _shell(title: str, inner: str) -> str:
    """Wrapper using ConferEd branded shell."""
    content = f"""
      <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 19px; font-weight: 700;">
        {escape(title)}
      </h2>
      {inner}
    """
    return _confered_shell(content)


def _otp_box(code: str, size: int = 28, spacing: int = 6) -> str:
    """Executive branded passcode badge."""
    return f"""
    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 18px 20px; margin: 20px 0; text-align: center;">
      <span style="display: inline-block; background-color: #0b3b8c; color: #ffffff; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: {size}px; font-weight: 800; letter-spacing: {spacing}px; padding: 10px 24px; border-radius: 8px; box-shadow: 0 2px 6px rgba(11, 59, 140, 0.2);">{escape(code)}</span>
    </div>
    """


def staff_login_otp_email(code: str, minutes: int, name: Optional[str] = None) -> tuple:
    """Staff Sign-in 2FA Verification Email."""
    subject = "ConferEd Talent Assess | Sign - in passcode"
    greeting = f"Hello {escape(name)}," if name else "Hello,"
    inner = f"""
      <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 19px; font-weight: 700;">
        {greeting}
      </h2>

      <p style="margin: 0 0 20px 0; color: #334155; font-size: 14px; line-height: 1.65;">
        A sign-in attempt was detected for your ConferEd Talent Assess staff account. Please use the one-time verification passcode below to complete your sign-in:
      </p>

      <!-- One-Time Passcode (OTP) Box -->
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 20px 24px; margin: 22px 0; text-align: center;">
        <p style="margin: 0 0 10px 0; color: #334155; font-size: 13px; font-weight: 600;">
          Your 2FA Verification Passcode:
        </p>
        <div style="display: inline-block; background-color: #0b3b8c; color: #ffffff; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 28px; font-weight: 800; letter-spacing: 6px; padding: 10px 24px; border-radius: 8px; box-shadow: 0 2px 6px rgba(11, 59, 140, 0.2);">
          {escape(code)}
        </div>
        <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px; font-weight: 500;">
          This passcode is valid for <strong>{minutes} minutes</strong>.
        </p>
      </div>

      <!-- Security Alert Notice -->
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0 0 4px 0; color: #92400e; font-size: 13px; font-weight: 700;">
          Security Notice
        </p>
        <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.55;">
          Never share this passcode with anyone. ConferEd support will never ask for your verification code. If you did not initiate this sign-in request, please secure your account immediately or notify your system administrator.
        </p>
      </div>
    """
    body = _confered_shell(inner)
    return subject, body


def staff_credentials_email(name: str, login_url: str, email: str, temp_password: str, is_reset: bool) -> tuple:
    """Sent by the system when an administrator creates a staff account or resets credentials."""
    subject = "ConferEd Talent Assess | Your Password was reset" if is_reset else "ConferEd Talent Assess | Your account is ready"
    
    action_text = (
        "An administrator has reset the password for your ConferEd Talent Assess staff account. Please use the temporary credentials below to sign in and set up your new permanent password."
        if is_reset
        else "An administrator has created a new staff account for you on ConferEd Talent Assess. You can now access the portal using the temporary credentials below."
    )

    inner = f"""
      <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 19px; font-weight: 700;">
        Hello {escape(name)},
      </h2>

      <p style="margin: 0 0 20px 0; color: #334155; font-size: 14px; line-height: 1.65;">
        {action_text}
      </p>

      <!-- Credentials Table -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
        <tr>
          <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600; width: 40%;">
            Sign-in Email / Login
          </td>
          <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 700; text-align: right;">
            {escape(email)}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 18px; color: #64748b; font-size: 13px; font-weight: 600;">
            Temporary Password
          </td>
          <td style="padding: 12px 18px; color: #0b3b8c; font-size: 14px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-weight: 700; text-align: right; letter-spacing: 1px;">
            {escape(temp_password)}
          </td>
        </tr>
      </table>

      <!-- CTA Button: Sign In -->
      <div style="text-align: center; margin: 28px 0 24px 0;">
        <a href="{escape(login_url)}" target="_blank" style="background-color: #0b3b8c; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(11, 59, 140, 0.25);">
          Sign in to Console
        </a>
      </div>

      <!-- Security Guidance Notice -->
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #2563eb; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0; color: #334155; font-size: 13px; line-height: 1.55;">
          <strong>Security Requirement:</strong> You will be required to choose a new password immediately upon signing in. This temporary password will expire once replaced. Do not share this email or password with anyone.
        </p>
      </div>

      <p style="margin: 0 0 16px 0; color: #64748b; font-size: 12px; word-break: break-all; line-height: 1.5;">
        <strong style="color: #475569;">Console URL:</strong> <a href="{escape(login_url)}" style="color: #2563eb; text-decoration: underline;">{escape(login_url)}</a>
      </p>
    """
    body = _confered_shell(inner)
    return subject, body


def candidate_invite_email(
    name: str,
    link: str,
    code: str,
    minutes: int = 30,
    expires_label: str = "",
    *,
    assessment_title: str = "Online Assessment",
    duration_minutes: int = 75,
    deadline_label: str = "",
    guidelines: str = "",
    to_email: str = "",
    scheduled_date: str = "",
    start_time: str = "",
) -> tuple:
    """Candidate assignment invitation email template."""
    clean_title = (assessment_title or "Technical").strip()
    if clean_title.lower().endswith(" assessment"):
        clean_title = clean_title[:-11].strip()
    subject = f"Invitation: You have been invited to take the {clean_title} Assessment"

    dur = int(duration_minutes) if duration_minutes else 75
    end_login_label = (deadline_label or expires_label or "Before deadline").strip()

    schedule_rows = []
    if scheduled_date:
        schedule_rows.append(f"""
        <tr>
          <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600; width: 45%;">
            Assessment Date
          </td>
          <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 700; text-align: right;">
            {escape(scheduled_date)}
          </td>
        </tr>""")
    if start_time:
        schedule_rows.append(f"""
        <tr>
          <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600; width: 45%;">
            Test Start Time
          </td>
          <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 700; text-align: right;">
            {escape(start_time)}
          </td>
        </tr>""")
    schedule_rows.append(f"""
        <tr>
          <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600; width: 45%;">
            Duration
          </td>
          <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 700; text-align: right;">
            {dur} min
          </td>
        </tr>""")
    schedule_rows.append(f"""
        <tr>
          <td style="padding: 12px 18px; color: #64748b; font-size: 13px; font-weight: 600;">
            End Login Date/Time
          </td>
          <td style="padding: 12px 18px; color: #0f172a; font-size: 13px; font-weight: 700; text-align: right;">
            {escape(end_login_label)}
          </td>
        </tr>""")
    table_rows_html = "".join(schedule_rows)

    if start_time:
        checkin_notice_html = f"Your exam starts promptly at <strong>{escape(start_time)}</strong>. Please check in <strong>30 minutes early</strong> to complete identity and system verification (webcam, microphone, and browser checks) so your assessment starts without delay."
    else:
        checkin_notice_html = "Please check in <strong>30 minutes before</strong> your scheduled exam time to complete identity and system verification (webcam, microphone, and browser checks). For example, if your exam starts at <strong>10:00 AM</strong>, you can check in at <strong>09:30 AM</strong> to finish verification, and your assessment will start promptly at <strong>10:00 AM</strong>."

    inner = f"""
      <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 19px; font-weight: 700;">
        Hello {escape(name)},
      </h2>

      <p style="margin: 0 0 20px 0; color: #334155; font-size: 14px; line-height: 1.65;">
        Thank you for applying for a position with ConferEd. The required next step to be considered for this position is to complete a technical test via our platform using a desktop browser. <strong style="color: #0f172a;">Note:</strong> This test is not available on a mobile device.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
        {table_rows_html}
      </table>

      <!-- 30-Minute Early Check-In Notification -->
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 22px 0;">
        <p style="margin: 0 0 6px 0; color: #92400e; font-size: 13px; font-weight: 700;">
          Notice: Check in 30 minutes before exam time
        </p>
        <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.55;">
          {checkin_notice_html}
        </p>
      </div>

      <!-- One-Time Passcode (OTP) Box -->
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 18px 20px; margin: 22px 0; text-align: center;">
        <p style="margin: 0 0 10px 0; color: #334155; font-size: 13px; font-weight: 600;">
          Use this one-time passcode (OTP) while logging in to access your assessment:
        </p>
        <div style="display: inline-block; background-color: #0b3b8c; color: #ffffff; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 26px; font-weight: 800; letter-spacing: 6px; padding: 10px 24px; border-radius: 8px; box-shadow: 0 2px 6px rgba(11, 59, 140, 0.2);">
          {escape(code)}
        </div>
        <p style="margin: 10px 0 0 0; color: #b91c1c; font-size: 12px; font-weight: 600;">
          Note: You need to use this passcode at the time of login only.
        </p>
      </div>

      <!-- CTA Button: Start Test -->
      <div style="text-align: center; margin: 28px 0 24px 0;">
        <a href="{escape(link)}" target="_blank" style="background-color: #0b3b8c; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(11, 59, 140, 0.25);">
          Start Test
        </a>
      </div>

      <p style="margin: 0 0 12px 0; color: #475569; font-size: 13px; line-height: 1.6;">
        You can also use this test link to access the test anytime before the test expiry date above. Please check date and time in your time zone.
      </p>

      <p style="margin: 0 0 18px 0; color: #64748b; font-size: 12px; word-break: break-all; line-height: 1.5;">
        <strong style="color: #475569;">Test Link:</strong> <a href="{escape(link)}" style="color: #2563eb; text-decoration: underline;">{escape(link)}</a>
      </p>

      <p style="margin: 0 0 14px 0; color: #64748b; font-size: 12px; line-height: 1.6;">
        For any technical queries, please refer to FAQ or contact support. For other inquiries please reply to this email to contact the individual who sent you the invitation.
      </p>
    """
    body = _confered_shell(inner)
    return subject, body


def candidate_resend_otp_email(name: str, code: str, minutes: int = 15, *, assessment_title: str = "") -> tuple:
    """Candidate Passcode Resend Email."""
    subject = "ConferEd Talent Assess | Your Assessment Passcode"
    
    clean_title = (assessment_title or "").strip()
    if clean_title.lower().endswith(" assessment"):
        clean_title = clean_title[:-11].strip()
    assessment_context = f" for the <strong>{escape(clean_title)} Assessment</strong>" if clean_title else ""

    inner = f"""
      <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 19px; font-weight: 700;">
        Hello {escape(name)},
      </h2>

      <p style="margin: 0 0 20px 0; color: #334155; font-size: 14px; line-height: 1.65;">
        You recently requested a new one-time passcode (OTP) to access your technical assessment{assessment_context} on ConferEd Talent Assess.
      </p>

      <!-- One-Time Passcode (OTP) Box -->
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 20px 24px; margin: 22px 0; text-align: center;">
        <p style="margin: 0 0 10px 0; color: #334155; font-size: 13px; font-weight: 600;">
          Your one-time login passcode:
        </p>
        <div style="display: inline-block; background-color: #0b3b8c; color: #ffffff; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 28px; font-weight: 800; letter-spacing: 6px; padding: 10px 24px; border-radius: 8px; box-shadow: 0 2px 6px rgba(11, 59, 140, 0.2);">
          {escape(code)}
        </div>
        <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px; font-weight: 500;">
          This passcode is valid for <strong>{minutes} minutes</strong>.
        </p>
      </div>

      <!-- Guidance Notice -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0; color: #334155; font-size: 13px; line-height: 1.55;">
          Enter this passcode on the sign-in screen to proceed to your assessment. If you did not request this passcode or have already logged in, you can safely disregard this email.
        </p>
      </div>

      <p style="margin: 0 0 14px 0; color: #64748b; font-size: 12px; line-height: 1.6;">
        For any technical queries, please refer to FAQ or contact support. For other inquiries please reply to this email to contact the individual who sent you the invitation.
      </p>
    """
    body = _confered_shell(inner)
    return subject, body


def staff_contact_changed_email(name: str, what: str, new_value: str, admin_email: str) -> tuple:
    """Staff Security Alert Email sent when login or 2FA credentials are modified."""
    subject = "ConferEd Talent Assess security notice: Your account details were changed"
    inner = f"""
      <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 19px; font-weight: 700;">
        Hello {escape(name)},
      </h2>

      <p style="margin: 0 0 20px 0; color: #334155; font-size: 14px; line-height: 1.65;">
        This is an automated security alert from ConferEd Talent Assess to inform you that your staff account details were recently updated by an administrator.
      </p>

      <!-- Alert Box -->
      <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #e11d48; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; color: #9f1239; font-size: 14px; font-weight: 700;">
          Account Details Changed
        </p>
        <p style="margin: 0 0 10px 0; color: #881337; font-size: 13px; line-height: 1.55;">
          Administrator: <strong>{escape(admin_email)}</strong><br>
          Updated Field: <strong>{escape(what)}</strong>
        </p>
        <div style="background-color: #ffffff; border: 1px solid #fda4af; border-radius: 6px; padding: 8px 14px; display: inline-block;">
          <span style="font-size: 12px; color: #64748b; font-weight: 600;">New Value:</span>
          <strong style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 13px; color: #0f172a; margin-left: 6px;">{escape(new_value)}</strong>
        </div>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0; color: #334155; font-size: 13px; line-height: 1.55;">
          <strong>Security Precaution:</strong> For your protection, all existing active login sessions for your account have been terminated. You will need to sign in again using your updated credentials.
        </p>
      </div>

      <p style="margin: 0 0 14px 0; color: #64748b; font-size: 12px; line-height: 1.6;">
        If you did not authorize or expect this change, please immediately contact your administrator at <a href="mailto:{escape(admin_email)}" style="color: #2563eb; text-decoration: underline;">{escape(admin_email)}</a> or contact ConferEd support.
      </p>
    """
    body = _confered_shell(inner)
    return subject, body


def test_email(platform_name: str, host: str, port: int) -> tuple:
    """Branded SMTP gateway test email."""
    subject = f"{platform_name or 'ConferEd Talent Assess'}: test email | SMTP Gateway Configuration"
    inner = f"""
      <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 19px; font-weight: 700;">
        SMTP Gateway Test Successful
      </h2>

      <p style="margin: 0 0 20px 0; color: #334155; font-size: 14px; line-height: 1.65;">
        This test message confirms that your SMTP email gateway for <strong>{escape(platform_name or 'ConferEd Talent Assess')}</strong> is correctly configured and operational.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
        <tr>
          <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600; width: 40%;">
            SMTP Server Host
          </td>
          <td style="padding: 12px 18px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 13px; font-weight: 700; text-align: right;">
            {escape(host)}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 18px; color: #64748b; font-size: 13px; font-weight: 600;">
            Port
          </td>
          <td style="padding: 12px 18px; color: #0f172a; font-size: 13px; font-weight: 700; text-align: right;">
            {port}
          </td>
        </tr>
      </table>

      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-left: 4px solid #10b981; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
        <p style="margin: 0; color: #065f46; font-size: 13px; line-height: 1.55;">
          Your email gateway is ready to dispatch candidate assessment invitations, one-time passcodes, and staff security notifications.
        </p>
      </div>
    """
    body = _confered_shell(inner)
    return subject, body

