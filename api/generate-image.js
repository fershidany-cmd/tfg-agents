// /api/generate-image.js
// Generates/edits recipe images via OpenAI gpt-image-1 (Image Edit API)
// Accepts an original photo + prompt → returns a modified version that looks real
// Falls back to generation mode if no image is provided
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

  const { prompt, size, quality, image } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }

  try {
    let data;

    if (image) {
      // MODE 1: Edit existing image with gpt-image-1 (multipart/form-data)
      // The 'image' field should be a base64 data URL like "data:image/jpeg;base64,..."
      const base64Match = image.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
      if (!base64Match) {
        return res.status(400).json({ error: 'Invalid image format. Expected base64 data URL.' });
      }

      const imgFormat = base64Match[1] === 'jpg' ? 'jpeg' : base64Match[1];
      const imgBase64 = base64Match[2];
      const imgBuffer = Buffer.from(imgBase64, 'base64');

      // Build multipart/form-data manually
      const boundary = '----FormBoundary' + Math.random().toString(36).substr(2);
      const parts = [];

      // Model
      parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\ngpt-image-1`);

      // Image file
      parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="image[]"; filename="recipe.${imgFormat}"\r\nContent-Type: image/${imgFormat}\r\n\r\n`);

      // Prompt
      parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${prompt}`);

      // Size
      parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n${size || '1024x1024'}`);

      // Quality
      parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="quality"\r\n\r\n${quality || 'high'}`);

      // End boundary
      const endBoundary = `\r\n--${boundary}--\r\n`;

      // Combine all parts with the binary image data
      const textParts = parts.join('\r\n');
      const beforeImage = textParts.split(`filename="recipe.${imgFormat}"\r\nContent-Type: image/${imgFormat}\r\n\r\n`)[0] + `filename="recipe.${imgFormat}"\r\nContent-Type: image/${imgFormat}\r\n\r\n`;
      const afterImage = '\r\n' + textParts.split(`filename="recipe.${imgFormat}"\r\nContent-Type: image/${imgFormat}\r\n\r\n`)[1];

      const beforeBuf = Buffer.from(beforeImage, 'utf-8');
      const afterBuf = Buffer.from(afterImage + endBoundary, 'utf-8');
      const body = Buffer.concat([beforeBuf, imgBuffer, afterBuf]);

      console.log('Using gpt-image-1 EDIT mode with reference image');

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: body
      });

      data = await response.json();
      console.log('Edit API response status:', response.status);

      if (data.error) {
        console.log('Edit API error:', JSON.stringify(data.error));
        return res.status(400).json({ error: data.error.message });
      }

      // gpt-image-1 returns b64_json by default
      if (data.data && data.data[0]) {
        const result = data.data[0];
        res.status(200).json({
          url: result.url || null,
          b64_json: result.b64_json || null,
          revised_prompt: result.revised_prompt || null
        });
      } else {
        return res.status(500).json({ error: 'Unexpected API response format' });
      }

    } else {
      // MODE 2: Generate from scratch with DALL-E 3 (fallback, no reference image)
      console.log('Using DALL-E 3 generation mode (no reference image)');

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

      data = await response.json();

      if (data.error) {
        return res.status(400).json({ error: data.error.message });
      }

      res.status(200).json({
        url: data.data[0].url,
        revised_prompt: data.data[0].revised_prompt
      });
    }

  } catch (e) {
    console.log('Generate image error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
