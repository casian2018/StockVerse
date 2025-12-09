export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return res.status(500).json({ message: 'Discord webhook URL not configured' });
  }

  const embed = {
    title: 'New Contact Message',
    color: 0x0099ff,
    fields: [
      {
        name: 'Name',
        value: name,
        inline: true,
      },
      {
        name: 'Email',
        value: email,
        inline: true,
      },
      {
        name: 'Message',
        value: message,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending to Discord:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
}