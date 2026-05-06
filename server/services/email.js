const nodemailer = require('nodemailer');

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendPasswordReset(email, token) {
  const transport = createTransport();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  await transport.sendMail({
    from: `"Elo Arc" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your Elo Arc password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#10101E;color:#EFEFEF;padding:32px;border-radius:10px">
        <h2 style="color:#7C6AF7">Reset your password</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C6AF7,#00E5A0);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Reset Password</a>
        <p style="margin-top:24px;color:#7A7A9A;font-size:12px">If you didn't request this, ignore this email.</p>
      </div>`,
  });
}

async function sendPDFReport(email, name, pdfBuffer, language = 'pt-BR') {
  const transport = createTransport();
  const subject = language === 'pt-BR'
    ? 'Seu relatório mensal Elo Arc está pronto'
    : 'Your monthly Elo Arc report is ready';
  const body = language === 'pt-BR'
    ? `Olá ${name},<br><br>Seu relatório mensal de coaching personalizado está em anexo. Boa leitura e bons estudos!`
    : `Hi ${name},<br><br>Your personalized monthly coaching report is attached. Happy reading and good studying!`;

  await transport.sendMail({
    from: `"Elo Arc" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;background:#10101E;color:#EFEFEF;padding:32px;border-radius:10px"><h2 style="background:linear-gradient(135deg,#7C6AF7,#00E5A0);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Elo Arc</h2><p>${body}</p></div>`,
    attachments: [{ filename: `elo-arc-report-${new Date().toISOString().slice(0, 7)}.pdf`, content: pdfBuffer }],
  });
}

async function sendWeeklyReport(email, name, summary, language = 'pt-BR') {
  const transport = createTransport();
  await transport.sendMail({
    from: `"Elo Arc" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: language === 'pt-BR' ? 'Seu resumo semanal - Elo Arc' : 'Your weekly summary - Elo Arc',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;background:#10101E;color:#EFEFEF;padding:32px;border-radius:10px"><h2 style="color:#7C6AF7">Elo Arc — ${language === 'pt-BR' ? 'Resumo Semanal' : 'Weekly Summary'}</h2><div style="white-space:pre-wrap">${summary}</div></div>`,
  });
}

module.exports = { sendPasswordReset, sendPDFReport, sendWeeklyReport };
