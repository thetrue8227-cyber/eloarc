const nodemailer = require('nodemailer');

function emailEnabled() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

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

function resetEmailHtml(resetUrl, language) {
  const isPt = language === 'pt-BR';
  const heading = isPt ? 'Redefinir sua senha' : 'Reset your password';
  const body = isPt
    ? 'Clique no botão abaixo para redefinir sua senha. O link expira em 1 hora.'
    : 'Click the button below to reset your password. This link expires in 1 hour.';
  const cta = isPt ? 'Redefinir senha' : 'Reset password';
  const ignore = isPt
    ? 'Se você não solicitou isso, ignore este email.'
    : "If you didn't request this, ignore this email.";

  return `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:auto;background:#10101E;color:#EFEFEF;padding:40px 32px;border-radius:14px;border:1px solid #1E1E32">
      <div style="margin-bottom:28px">
        <span style="font-family:Sora,sans-serif;font-weight:800;font-size:22px;background:linear-gradient(135deg,#7C6AF7,#00E5A0);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Elo Arc</span>
      </div>
      <h2 style="font-family:Sora,sans-serif;font-weight:700;color:#EFEFEF;margin:0 0 12px;font-size:22px">${heading}</h2>
      <p style="color:#B0B0C0;line-height:1.65;font-size:14px;margin:0 0 24px">${body}</p>
      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C6AF7,#00E5A0);color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">${cta}</a>
      <p style="margin-top:28px;color:#7A7A9A;font-size:12px;line-height:1.6;border-top:1px solid #1E1E32;padding-top:18px">${ignore}</p>
    </div>`;
}

async function sendPasswordReset(email, token, language = 'pt-BR') {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  if (!emailEnabled()) {
    console.warn('[email] EMAIL_USER not configured — printing reset link to console as fallback:');
    console.warn(`[email] Reset link for ${email}: ${resetUrl}`);
    return;
  }

  const transport = createTransport();
  const subject = language === 'pt-BR'
    ? 'Redefinir sua senha — Elo Arc'
    : 'Reset your Elo Arc password';

  await transport.sendMail({
    from: `"Elo Arc" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: resetEmailHtml(resetUrl, language),
  });
  console.log('[email] password reset sent to', email);
}

async function sendPDFReport(email, name, pdfBuffer, language = 'pt-BR') {
  if (!emailEnabled()) {
    console.warn('[email] EMAIL_USER not configured — PDF report not sent for', email);
    return;
  }
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
  if (!emailEnabled()) {
    console.warn('[email] EMAIL_USER not configured — weekly report not sent for', email);
    return;
  }
  const transport = createTransport();
  await transport.sendMail({
    from: `"Elo Arc" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: language === 'pt-BR' ? 'Seu resumo semanal - Elo Arc' : 'Your weekly summary - Elo Arc',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto;background:#10101E;color:#EFEFEF;padding:32px;border-radius:10px"><h2 style="color:#7C6AF7">Elo Arc — ${language === 'pt-BR' ? 'Resumo Semanal' : 'Weekly Summary'}</h2><div style="white-space:pre-wrap">${summary}</div></div>`,
  });
}

module.exports = { sendPasswordReset, sendPDFReport, sendWeeklyReport, emailEnabled };
