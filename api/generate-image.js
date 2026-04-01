// /api/generate-image.js
// Generates/edits recipe images via OpenAI gpt-image-1 (Image Edit API)
// Accepts original photo + catalog reference images + prompt
// Falls back to DALL-E 3 generation if no images provided
// Env var required: OPENAI_API_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, size, quality, image, referenceImages } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  try {
    // Collect all images (original photo + catalog references)
    const allImages = [];

    // Add original photo first (most important reference)
    if (image) {
      const parsed = parseDataUrl(image);
      if (parsed) allImages.push({ buffer: parsed.buffer, format: parsed.format, name: 'original' });
    }

    // Add catalog reference images
    if (referenceImages && Array.isArray(referenceImages)) {
      for (let i = 0; i < referenceImages.length; i++) {
        const ref = referenceImages[i];
        const dataUrl = typeof ref === 'string' ? ref : ref.dataUrl;
        if (dataUrl) {
          const parsed = parseDataUrl(dataUrl);
          if (parsed) allImages.push({ buffer: parsed.buffer, format: parsed.format, name: `ref${i}` });
        }
      }
    }

    console.log(`[generate-image] ${allImages.length} images total (1 original + ${allImages.length - 1} catalog refs)`);

    if (allImages.length > 0) {
      // MODE 1: Edit with gpt-image-1 + multiple reference images
      const boundary = '----FormBoundary' + Math.random().toString(36).substr(2);
      const chunks = [];

      // Model field
      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\ngpt-image-1\r\n`));

      // All image files as image[] array
      for (const img of allImages) {
        chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image[]"; filename="${img.name}.${img.format}"\r\nContent-Type: image/${img.format}\r\n\r\n`));
        chunks.push(img.buffer);
        chunks.push(Buffer.from('\r\n'));
      }

      // Prompt field
      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${prompt}\r\n`));

      // Size field
      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n${size || '1024x1024'}\r\n`));

      // Quality field
      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="quality"\r\n\r\n${quality || 'high'}\r\n`));

      // End boundary
      chunks.push(Buffer.from(`--${boundary}--\r\n`));

      const body = Buffer.concat(chunks);

      console.log(`[generate-image] Sending ${allImages.length} images to gpt-image-1 edit API (${Math.round(body.length / 1024)}KB total)`);

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: body
      });

      const data = await response.json();
      console.log('[generate-image] Edit API status:', response.status);

      if (data.error) {
        console.log('[generate-image] Edit API error:', JSON.stringify(data.error));
        return res.status(400).json({ error: data.error.message });
      }

      if (data.data && data.data[0]) {
        const result = data.data[0];
        return res.status(200).json({
          url: result.url || null,
          b64_json: result.b64_json || null,
          revised_prompt: result.revised_prompt || null
        });
      }
      return res.status(500).json({ error: 'Unexpected API response format' });

    } else {
      // MODE 2: Generate from scratch with DALL-E 3 (no reference images)
      console.log('[generate-image] No images provided, using DALL-E 3 generation');
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt, n: 1,
          size: size || '1024x1024',
          quality: quality || 'hd'
        })
      });

      const data = await response.json();
      if (data.error) return res.status(400).json({ error: data.error.message });
      return res.status(200).json({
        url: data.data[0].url,
        revised_prompt: data.data[0].revised_prompt
      });
    }

  } catch (e) {
    console.log('[generate-image] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
}

function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) return null;
  const format = match[1] === 'jpg' ? 'jpeg' : match[1];
  return { buffer: Buffer.from(match[2], 'base64'), format };
}
