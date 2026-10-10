import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape
from typing import Optional

from app.core.config import settings

logger = logging.getLogger("nexus.email")


def send_email(to_email: str, subject: str, body_html: str,
               sender_email: Optional[str] = None, app_password: Optional[str] = None,
               host: Optional[str] = None, port: Optional[int] = None) -> bool:
    """Send an HTML email over SMTP (STARTTLS). Never raises; returns True on success."""
    sender = sender_email or settings.GMAIL_SENDER_EMAIL
    password = (app_password or settings.GMAIL_APP_PASSWORD or "").replace(" ", "")
    if not sender or not password:
        logger.warning("SMTP credentials missing - email to %s not sent", to_email)
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"NexusAssess Evaluation Platform <{sender}>"
        msg["To"] = to_email
        msg.attach(MIMEText(body_html, "html"))

        server = smtplib.SMTP(host or settings.SMTP_HOST, port or settings.SMTP_PORT, timeout=12)
        try:
            server.ehlo()
            server.starttls()
            server.login(sender, password)
            server.sendmail(sender, [to_email], msg.as_string())
        finally:
            try:
                server.quit()
            except Exception:
                pass
        return True
    except Exception as exc:  # network / auth problems must not break the API
        logger.error("Email delivery to %s failed: %s", to_email, exc)
        return False


# ----------------------------------------------------------------- templates
def _shell(title: str, inner: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; background-color: #090d16; padding: 24px; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
      <h2 style="margin: 0 0 16px 0; color: #3b82f6;">Nexus<span style="color: #60a5fa;">Assess</span></h2>
      <h3 style="color: #ffffff;">{title}</h3>
      {inner}
    </div>
    """


def _otp_box(code: str) -> str:
    return f"""
    <div style="background-color: #1e293b; border: 1px solid #334155; padding: 18px; border-radius: 12px; text-align: center; margin: 20px 0;">
      <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981;">{escape(code)}</span>
    </div>
    """


def staff_login_otp_email(code: str, minutes: int) -> tuple:
    subject = f"NexusAssess Security: Your sign-in passcode [{code}]"
    body = _shell(
        "Sign-in verification",
        f"""<p style="color: #94a3b8; font-size: 14px;">Use this one-time passcode to finish signing in:</p>
        {_otp_box(code)}
        <p style="color: #64748b; font-size: 12px;">Valid for {minutes} minutes. If this wasn't you, change your password.</p>""",
    )
    return subject, body


def password_reset_otp_email(code: str, minutes: int) -> tuple:
    subject = f"NexusAssess Security: Password reset passcode [{code}]"
    body = _shell(
        "Password reset request",
        f"""<p style="color: #94a3b8; font-size: 14px;">Use this one-time passcode to reset your password:</p>
        {_otp_box(code)}
        <p style="color: #64748b; font-size: 12px;">Valid for {minutes} minutes. If you didn't request this, ignore this email.</p>""",
    )
    return subject, body


def candidate_invite_email(name: str, link: str, code: str, minutes: int, expires_label: str) -> tuple:
    subject = f"Assessment Invitation - OTP [{code}]"
    body = _shell(
        f"Hello {escape(name)},",
        f"""<p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">You have been invited to take an online assessment.
        Open your personal link below and enter this one-time passcode when asked:</p>
        {_otp_box(code)}
        <div style="margin: 24px 0;">
          <a href="{escape(link)}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">BEGIN ONLINE ASSESSMENT</a>
        </div>
        <p style="color: #64748b; font-size: 12px;">The passcode is valid for {minutes} minutes after it is issued; the link expires {escape(expires_label)}. This link is personal - do not share it.</p>""",
    )
    return subject, body


def candidate_resend_otp_email(name: str, code: str, minutes: int) -> tuple:
    subject = f"Your assessment passcode [{code}]"
    body = _shell(
        f"Hello {escape(name)},",
        f"""<p style="color: #94a3b8; font-size: 14px;">Here is your new one-time passcode:</p>
        {_otp_box(code)}
        <p style="color: #64748b; font-size: 12px;">Valid for {minutes} minutes.</p>""",
    )
    return subject, body
