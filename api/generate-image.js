// /api/generate-image.js
// Generates recipe images via DALL-E 3 (server-side, no API key exposed in frontend)
// Env var required: OPENAI_API_KEY

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, size, quality } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size || '1024x1024',
        quality: quality || 'hd'
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    res.status(200).json({
      url: data.data[0].url,
      revised_prompt: data.data[0].revised_prompt
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
