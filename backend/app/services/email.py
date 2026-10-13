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
def _shell(title: str, inner: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; background-color: #090d16; padding: 24px; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
      <h2 style="margin: 0 0 16px 0; color: #3b82f6;">Nexus<span style="color: #60a5fa;">Assess</span></h2>
      <h3 style="color: #ffffff;">{title}</h3>
      {inner}
    </div>
    """


def _otp_box(code: str, size: int = 32, spacing: int = 8) -> str:
    return f"""
    <div style="background-color: #1e293b; border: 1px solid #334155; padding: 18px; border-radius: 12px; text-align: center; margin: 20px 0;">
      <span style="font-family: monospace; font-size: {size}px; font-weight: bold; letter-spacing: {spacing}px; color: #10b981;">{escape(code)}</span>
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


def staff_credentials_email(name: str, login_url: str, email: str, temp_password: str, is_reset: bool) -> tuple:
    """Sent by the system when an administrator creates an account or resets a password."""
    title = "Your password was reset" if is_reset else "Your NexusAssess account is ready"
    subject = f"NexusAssess: {title}"
    body = _shell(
        f"Hello {escape(name)},",
        f"""<p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        {"An administrator reset your password." if is_reset else "An administrator created a staff account for you."}
        Sign in with the temporary password below. You will be asked to choose your own password straight away.</p>
        <p style="color: #94a3b8; font-size: 13px;">Login: <strong style="color:#e2e8f0">{escape(email)}</strong></p>
        {_otp_box(temp_password, size=22, spacing=2)}
        <div style="margin: 24px 0;">
          <a href="{escape(login_url)}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">SIGN IN</a>
        </div>
        <p style="color: #64748b; font-size: 12px;">Do not share this password. It stops working as soon as you set a new one.</p>""",
    )
    return subject, body


def candidate_invite_email(
    name: str,
    link: str,
    code: str,
    minutes: int,
    expires_label: str,
    *,
    assessment_title: str = "Online Assessment",
    duration_minutes: int = 60,
    deadline_label: str = "",
    guidelines: str = "",
    to_email: str = "",
) -> tuple:
    """Invitation with duration, deadline, unique link, and Begin Assessment CTA."""
    subject = f"Invitation: {assessment_title}"
    guide = guidelines or (
        "Find a quiet place with a stable internet connection. Keep your camera on if required. "
        "Do not share this personal link. After the deadline the link will no longer work."
    )
    deadline_row = (
        f'<tr><td style="padding:6px 0;color:#94a3b8;font-size:13px;">Deadline</td>'
        f'<td style="padding:6px 0;color:#e2e8f0;font-size:13px;font-weight:600;text-align:right;">{escape(deadline_label)}</td></tr>'
        if deadline_label else ""
    )
    body = _shell(
        f"Hello {escape(name)},",
        f"""        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
        You have been invited to complete <strong style="color:#e2e8f0">{escape(assessment_title)}</strong>.</p>
        {f'<p style="color: #94a3b8; font-size: 14px;">This message was sent to <strong style="color:#e2e8f0">{escape(to_email)}</strong>.</p>' if to_email else ''}
        <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#0f172a;border-radius:10px;padding:12px;">
          <tr><td style="padding:6px 0;color:#94a3b8;font-size:13px;">Assessment time</td>
              <td style="padding:6px 0;color:#e2e8f0;font-size:13px;font-weight:600;text-align:right;">{int(duration_minutes)} minutes</td></tr>
          {deadline_row}
          <tr><td style="padding:6px 0;color:#94a3b8;font-size:13px;">Link expires</td>
              <td style="padding:6px 0;color:#e2e8f0;font-size:13px;font-weight:600;text-align:right;">{escape(expires_label)}</td></tr>
        </table>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">Use your unique link below. When prompted, enter this one-time passcode:</p>
        {_otp_box(code)}
        <div style="margin: 28px 0; text-align: center;">
          <a href="{escape(link)}" target="_blank"
             style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none;
                    border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block;">
            BEGIN ASSESSMENT
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px; word-break: break-all;">
          Unique link: <a href="{escape(link)}" style="color:#60a5fa;">{escape(link)}</a>
        </p>
        <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 16px;">
          <strong style="color:#94a3b8;">Guidelines:</strong> {escape(guide)}
          The passcode is valid for {minutes} minutes after issue. This link is personal — do not forward it.
        </p>""",
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


def staff_contact_changed_email(name: str, what: str, new_value: str, admin_email: str) -> tuple:
    """Sent to the PREVIOUS address when an administrator changes a staff member's login / 2FA email."""
    subject = "NexusAssess security notice: your account details were changed"
    body = _shell(
        f"Hello {escape(name)},",
        f"""<p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">An administrator ({escape(admin_email)})
        changed the <strong style="color:#e2e8f0">{escape(what)}</strong> of your NexusAssess account to
        <strong style="color:#e2e8f0">{escape(new_value)}</strong>. You have been signed out everywhere.</p>
        <p style="color: #64748b; font-size: 12px;">If you did not expect this, contact your administrator right away.</p>""",
    )
    return subject, body
