// /api/generate-image.js
// Generates/edits recipe images via GPT-4o Responses API (same as ChatGPT)
// Sends original photo + catalog reference images as conversation input
// GPT-4o UNDERSTANDS the images before generating — produces much better results
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
    // Collect all images
    const allImages = [];

    // Add original photo first
    if (image) {
      const dataUrl = ensureDataUrl(image);
      if (dataUrl) allImages.push({ dataUrl, label: 'original' });
    }

    // Add catalog reference images
    if (referenceImages && Array.isArray(referenceImages)) {
      for (let i = 0; i < referenceImages.length; i++) {
        const ref = referenceImages[i];
        const raw = typeof ref === 'string' ? ref : ref.dataUrl;
        const dataUrl = ensureDataUrl(raw);
        if (dataUrl) allImages.push({ dataUrl, label: `catalog_ref_${i + 1}` });
      }
    }

    console.log(`[generate-image] ${allImages.length} images total`);

    if (allImages.length > 0) {
      // MODE 1: GPT-4o Responses API with image generation
      // This is the SAME engine ChatGPT uses — model sees & understands images
      const inputContent = [];

      // Add all images as input
      for (const img of allImages) {
        inputContent.push({
          type: 'input_image',
          image_url: img.dataUrl,
          detail: 'high'
        });
      }

      // Add the prompt text
      inputContent.push({
        type: 'input_text',
        text: prompt
      });

      const requestBody = {
        model: 'gpt-4o',
        input: [
          {
            role: 'user',
            content: inputContent
          }
        ],
        tools: [
          {
            type: 'image_generation',
            quality: quality || 'high',
            size: size || '1024x1024'
          }
        ]
      };

      console.log(`[generate-image] Sending ${allImages.length} images to GPT-4o Responses API`);

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('[generate-image] Responses API status:', response.status);

      if (data.error) {
        console.log('[generate-image] API error:', JSON.stringify(data.error));
        return res.status(400).json({ error: data.error.message });
      }

      // Extract generated image from response output
      if (data.output && Array.isArray(data.output)) {
        for (const item of data.output) {
          // Check for image generation result
          if (item.type === 'image_generation_call' && item.result) {
            return res.status(200).json({
              b64_json: item.result,
              revised_prompt: null
            });
          }
          // Also check nested content blocks
          if (item.content && Array.isArray(item.content)) {
            for (const block of item.content) {
              if (block.type === 'image' && block.image_url) {
                return res.status(200).json({
                  url: block.image_url,
                  revised_prompt: null
                });
              }
            }
          }
        }
      }

      // Log full response for debugging if no image found
      console.log('[generate-image] Full response:', JSON.stringify(data).substring(0, 2000));
      return res.status(500).json({ error: 'No image found in GPT-4o response. Check server logs.' });

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

function ensureDataUrl(input) {
  if (!input) return null;
  if (input.startsWith('data:image/')) return input;
  // If it's raw base64, assume JPEG
  if (/^[A-Za-z0-9+/=]+$/.test(input.substring(0, 100))) {
    return `data:image/jpeg;base64,${input}`;
  }
  return null;
}
