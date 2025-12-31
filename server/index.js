require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Setup multer storage for uploads -> store in server/uploads with unique filename
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const now = Date.now();
    const safe = file.originalname.replace(/[^a-z0-9.\-\_]/gi, '_');
    cb(null, `${now}_${safe}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.get('/', (req, res) => res.send('Kato.8 Careers backend is running'));

async function sendMail({ name, role, email, links, message, filePath, fileName }) {
  const to = process.env.TO_EMAIL || 'terryt.kato.8@gmail.com';
  const from = process.env.FROM_EMAIL || `no-reply@kato8.local`;
  const subject = `Kato.8 Careers — ${role}${name ? ' — ' + name : ''}`;

  const text = `New application for ${role}\n\nName: ${name || '—'}\nEmail: ${email || '—'}\nLinks: ${links || '—'}\n\nMessage:\n${message || '—'}`;

  const html = `
    <h2>New application for ${role}</h2>
    <p><strong>Name:</strong> ${name || '—'}</p>
    <p><strong>Email:</strong> ${email || '—'}</p>
    <p><strong>Links:</strong> ${links || '—'}</p>
    <h3>Message</h3>
    <pre style="white-space:pre-wrap">${message || '—'}</pre>
  `;

  // If SMTP is configured, send email. Otherwise log to console for development.
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = { from, to, subject, text, html };
    if (filePath && fileName) {
      mailOptions.attachments = [{ filename: fileName, path: filePath }];
    }

    const info = await transporter.sendMail(mailOptions);
    return info;
  } else {
    console.log('SMTP not configured — application payload:');
    console.log({ name, role, email, links, message, filePath, fileName });
    return { logged: true };
  }
}

// Endpoint for form submissions with optional file upload (resume)
app.post('/apply', upload.single('resume'), async (req, res) => {
  try {
    const { name, role, _replyto, links, message } = req.body || {};
    const email = _replyto || (req.body.email);
    if (!role || !email) return res.status(400).json({ ok: false, error: 'role and email are required' });

    let filePath;
    let fileName;
    if (req.file) {
      filePath = req.file.path;
      fileName = req.file.originalname;
    }

    const info = await sendMail({ name, role, email, links, message, filePath, fileName });

    // Optionally: keep the file but you can also delete after sending
    // if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ ok: true, info });
  } catch (err) {
    console.error('Error handling /apply:', err);
    res.status(500).json({ ok: false, error: err.message || 'server error' });
  }
});

app.listen(PORT, () => console.log(`Careers backend listening on http://localhost:${PORT}`));
