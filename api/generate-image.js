// /api/generate-image.js
// Tries GPT-4o Responses API first (best quality, like ChatGPT)
// Falls back to gpt-image-1 Edit API if GPT-4o fails (e.g. org not verified)
// Falls back to DALL-E 3 if no images provided
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
    // Collect all images
    const allImages = [];

    if (image) {
      const parsed = parseDataUrl(image);
      if (parsed) allImages.push(parsed);
    }

    if (referenceImages && Array.isArray(referenceImages)) {
      for (let i = 0; i < referenceImages.length; i++) {
        const ref = referenceImages[i];
        const raw = typeof ref === 'string' ? ref : ref.dataUrl;
        const parsed = parseDataUrl(raw);
        if (parsed) allImages.push(parsed);
      }
    }

    console.log(`[generate-image] ${allImages.length} images total`);

    if (allImages.length > 0) {
      // TRY 1: GPT-4o Responses API (best quality — like ChatGPT)
      try {
        console.log(`[generate-image] Trying GPT-4o Responses API...`);
        const inputContent = [];
        for (const img of allImages) {
          inputContent.push({
            type: 'input_image',
            image_url: img.dataUrl,
            detail: 'high'
          });
        }
        inputContent.push({ type: 'input_text', text: prompt });

        const gpt4oResp = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            input: [{ role: 'user', content: inputContent }],
            tools: [{ type: 'image_generation', quality: quality || 'high', size: size || '1024x1024' }]
          })
        });

        const gpt4oData = await gpt4oResp.json();

        if (!gpt4oData.error && gpt4oData.output) {
          for (const item of gpt4oData.output) {
            if (item.type === 'image_generation_call' && item.result) {
              console.log('[generate-image] GPT-4o success!');
              return res.status(200).json({ b64_json: item.result, revised_prompt: null, engine: 'gpt-4o' });
            }
            if (item.content && Array.isArray(item.content)) {
              for (const block of item.content) {
                if (block.type === 'image' && block.image_url) {
                  console.log('[generate-image] GPT-4o success (url)!');
                  return res.status(200).json({ url: block.image_url, revised_prompt: null, engine: 'gpt-4o' });
                }
              }
            }
          }
        }

        console.log('[generate-image] GPT-4o failed:', gpt4oData.error?.message || 'no image in response');
      } catch (e) {
        console.log('[generate-image] GPT-4o error:', e.message);
      }

      // TRY 2: gpt-image-1 Edit API (fallback — still good with references)
      console.log(`[generate-image] Falling back to gpt-image-1 Edit API...`);
      const boundary = '----FormBoundary' + Math.random().toString(36).substr(2);
      const chunks = [];

      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\ngpt-image-1\r\n`));

      for (let i = 0; i < allImages.length; i++) {
        const img = allImages[i];
        chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image[]"; filename="img${i}.${img.format}"\r\nContent-Type: image/${img.format}\r\n\r\n`));
        chunks.push(img.buffer);
        chunks.push(Buffer.from('\r\n'));
      }

      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${prompt}\r\n`));
      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n${size || '1024x1024'}\r\n`));
      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="quality"\r\n\r\n${quality || 'high'}\r\n`));
      chunks.push(Buffer.from(`--${boundary}--\r\n`));

      const body = Buffer.concat(chunks);
      console.log(`[generate-image] Sending ${allImages.length} images to gpt-image-1 (${Math.round(body.length / 1024)}KB)`);

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: body
      });

      const data = await response.json();
      if (data.error) return res.status(400).json({ error: data.error.message });

      if (data.data && data.data[0]) {
        const result = data.data[0];
        return res.status(200).json({
          url: result.url || null,
          b64_json: result.b64_json || null,
          revised_prompt: result.revised_prompt || null,
          engine: 'gpt-image-1'
        });
      }
      return res.status(500).json({ error: 'Unexpected API response' });

    } else {
      // MODE 3: DALL-E 3 from scratch (no photos)
      console.log('[generate-image] No images, using DALL-E 3');
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: size || '1024x1024', quality: quality || 'hd' })
      });
      const data = await response.json();
      if (data.error) return res.status(400).json({ error: data.error.message });
      return res.status(200).json({ url: data.data[0].url, revised_prompt: data.data[0].revised_prompt, engine: 'dall-e-3' });
    }

  } catch (e) {
    console.log('[generate-image] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
}

function parseDataUrl(input) {
  if (!input) return null;
  // Ensure it's a data URL
  let dataUrl = input;
  if (!input.startsWith('data:image/')) {
    if (/^[A-Za-z0-9+/=]+$/.test(input.substring(0, 100))) {
      dataUrl = `data:image/jpeg;base64,${input}`;
    } else return null;
  }
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) return null;
  const format = match[1] === 'jpg' ? 'jpeg' : match[1];
  return { buffer: Buffer.from(match[2], 'base64'), format, dataUrl };
}
