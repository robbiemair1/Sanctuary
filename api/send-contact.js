const nodemailer = require('nodemailer');

function escapeHtml(input) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    const missingEnv = requiredEnv.filter((key) => !String(process.env[key] || '').trim());
    if (missingEnv.length > 0) {
      return res.status(500).json({
        error: `Missing SMTP environment variables: ${missingEnv.join(', ')}`
      });
    }

    const {
      fullName,
      organisation,
      email,
      operationalHomes,
      ofstedOutcome,
      propertyInterest,
      message
    } = req.body || {};

    const required = {
      fullName,
      organisation,
      email,
      operationalHomes,
      ofstedOutcome,
      propertyInterest
    };

    for (const [field, value] of Object.entries(required)) {
      if (!String(value || '').trim()) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const smtpHost = String(process.env.SMTP_HOST || '').trim();
    const smtpTlsServername = String(process.env.SMTP_TLS_SERVERNAME || smtpHost).trim();

    const rawPass = String(process.env.SMTP_PASS || '');
    const normalizedPass = rawPass
      .replace(/^"(.*)"$/, '$1')
      .replace(/^'(.*)'$/, '$1');

    const smtpPort = Number(process.env.SMTP_PORT || 465);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      requireTLS: smtpPort !== 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: normalizedPass
      },
      tls: {
        servername: smtpTlsServername
      }
    });

    const toEmail = process.env.CONTACT_TO_EMAIL || 'himanshu@hitoritech.com';

    await transporter.sendMail({
      from: `Sanctuary Website <${process.env.SMTP_USER}>`,
      to: toEmail,
      replyTo: email,
      subject: `New Sanctuary enquiry from ${fullName}`,
      text: [
        'New contact form submission from Sanctuary website.',
        '',
        `Full name: ${fullName}`,
        `Organisation: ${organisation}`,
        `Email: ${email}`,
        `Operational homes: ${operationalHomes}`,
        `Most recent Ofsted outcome: ${ofstedOutcome}`,
        `Property of interest: ${propertyInterest}`,
        `Anything else: ${message || 'N/A'}`
      ].join('\n'),
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Full name:</strong> ${escapeHtml(fullName)}</p>
        <p><strong>Organisation:</strong> ${escapeHtml(organisation)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Operational homes:</strong> ${escapeHtml(operationalHomes)}</p>
        <p><strong>Most recent Ofsted outcome:</strong> ${escapeHtml(ofstedOutcome)}</p>
        <p><strong>Property of interest:</strong> ${escapeHtml(propertyInterest)}</p>
        <p><strong>Anything else:</strong><br>${escapeHtml(message || 'N/A').replace(/\n/g, '<br>')}</p>
      `
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('SMTP send error:', {
      message: error.message,
      code: error.code,
      responseCode: error.responseCode,
      command: error.command
    });

    return res.status(500).json({
      error: `SMTP send failed (${error.code || error.responseCode || 'unknown_error'}). Check SMTP host/port/user/pass in Vercel env.`
    });
  }
};
