const tls = require('tls');

function sendGmailSMTP(sender, appPassword, recipient, subject, htmlBody) {
  return new Promise((resolve, reject) => {
    const cleanPassword = appPassword.replace(/\s+/g, '');
    const socket = tls.connect(465, 'smtp.gmail.com', () => {
      console.log('Connected to smtp.gmail.com:465');
    });

    let step = 0;
    const authStr = `\0${sender}\0${cleanPassword}`;
    const authBase64 = Buffer.from(authStr).toString('base64');

    socket.on('data', (data) => {
      const msg = data.toString();
      console.log('Gmail SMTP Response:', msg.trim());

      if (step === 0 && msg.startsWith('220')) {
        step = 1;
        socket.write(`EHLO localhost\r\n`);
      } else if (step === 1 && msg.includes('250')) {
        step = 2;
        socket.write(`AUTH PLAIN ${authBase64}\r\n`);
      } else if (step === 2 && msg.startsWith('235')) {
        step = 3;
        socket.write(`MAIL FROM:<${sender}>\r\n`);
      } else if (step === 3 && msg.startsWith('250')) {
        step = 4;
        socket.write(`RCPT TO:<${recipient}>\r\n`);
      } else if (step === 4 && msg.startsWith('250')) {
        step = 5;
        socket.write(`DATA\r\n`);
      } else if (step === 5 && msg.startsWith('354')) {
        step = 6;
        const rawMail = 
          `From: "NexusAssess Evaluation Platform" <${sender}>\r\n` +
          `To: ${recipient}\r\n` +
          `Subject: ${subject}\r\n` +
          `MIME-Version: 1.0\r\n` +
          `Content-Type: text/html; charset=utf-8\r\n\r\n` +
          `${htmlBody}\r\n.\r\n`;
        socket.write(rawMail);
      } else if (step === 6 && msg.startsWith('250')) {
        step = 7;
        socket.write(`QUIT\r\n`);
        resolve(true);
      }
    });

    socket.on('error', (err) => {
      console.error('SMTP Socket Error:', err);
      reject(err);
    });
  });
}

const sender = "udayrise7666@gmail.com";
const appPassword = "fjac ucsg fnfb iemd";
const recipient = "udayrise7666@gmail.com";
const subject = "NexusAssess Live Test Email & Assessment Link";
const html = `
  <div style="font-family: Arial, sans-serif; background-color: #0f172a; padding: 24px; color: #ffffff; border-radius: 16px;">
    <h2 style="color: #3b82f6;">NexusAssess Assessment Platform</h2>
    <p>Hello Marcus Vance,</p>
    <p>Your Assessment Link and 2FA Access OTP have been generated.</p>
    <p>Access Passcode OTP: <strong style="color: #10b981; font-size: 20px;">970598</strong></p>
    <p><a href="http://localhost:3000/?assessment=assess-101" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">BEGIN ASSESSMENT ➔</a></p>
  </div>
`;

sendGmailSMTP(sender, appPassword, recipient, subject, html)
  .then(() => console.log('SUCCESS: Real email sent to udayrise7666@gmail.com via Node TLS!'))
  .catch(err => console.error('FAILED:', err));
