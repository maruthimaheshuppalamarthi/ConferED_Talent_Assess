import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

sender_email = "udayrise7666@gmail.com"
app_password = "fjacucsgfnfbiemd"
recipient_email = "udayrise7666@gmail.com"

print(f"Testing Gmail SMTP connection for {sender_email}...")

try:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "NexusAssess Live Test Email & Assessment Link"
    msg["From"] = f"NexusAssess Evaluation Platform <{sender_email}>"
    msg["To"] = recipient_email

    html_content = """
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 24px; color: #ffffff; border-radius: 16px;">
        <h2 style="color: #3b82f6;">NexusAssess Assessment Platform</h2>
        <p>Hello Marcus Vance,</p>
        <p>Your Online Assessment Link & 2FA OTP Access Code has been generated.</p>
        <p>Access OTP: <strong style="color: #10b981; font-size: 20px;">970598</strong></p>
        <p><a href="http://localhost:3000/?assessment=assess-101" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">START ASSESSMENT ➔</a></p>
    </div>
    """
    msg.attach(MIMEText(html_content, "html"))

    server = smtplib.SMTP("smtp.gmail.com", 587, timeout=15)
    server.ehlo()
    server.starttls()
    print("TLS handshake successful. Logging in...")
    server.login(sender_email, app_password)
    print("Login successful! Sending mail...")
    server.sendmail(sender_email, [recipient_email], msg.as_string())
    server.quit()
    print("SUCCESS: Real email sent to udayrise7666@gmail.com!")
except Exception as e:
    print(f"ERROR Sending Email: {type(e).__name__}: {e}")
