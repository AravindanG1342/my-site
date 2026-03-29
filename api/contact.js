const { Resend } = require('resend');

async function sendTelegram(name, message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text = `📬 New message via Birds from my Backyard\n\nFrom: ${name}\n\n${message}`;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required' });
  }

  const toEmail = process.env.CONTACT_TO_EMAIL;
  if (!toEmail) {
    console.error('CONTACT_TO_EMAIL is not set in .env');
    return res.status(500).json({ error: 'Server not configured for email' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // Send both notifications in parallel
    await Promise.all([
      resend.emails.send({
        from: 'Birds from my Backyard <onboarding@resend.dev>',
        to: toEmail,
        subject: `Message from ${name} — Birds from my Backyard`,
        text: `You have a new message via your bird gallery website.\n\nFrom: ${name}\n\nMessage:\n${message}`
      }),
      sendTelegram(name, message)
    ]);

    res.json({ ok: true });
  } catch (err) {
    console.error('Contact handler error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
