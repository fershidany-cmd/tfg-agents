// /api/catalog-images.js
// Returns 4 random recipe image URLs from the TFG catalog as base64
// These are used as style reference for gpt-image-1 when generating new images
// Env vars required: TFG_ADMIN_URL, TFG_SESSION_TOKEN

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const adminUrl = process.env.TFG_ADMIN_URL || 'https://the-fitness-garage.com';
  const sessionToken = process.env.TFG_SESSION_TOKEN;

  if (!sessionToken) {
    return res.status(500).json({ error: 'TFG_SESSION_TOKEN not configured' });
  }

  const cookie = `__Secure-next-auth.session-token=${sessionToken}; next-auth.session-token=${sessionToken}`;

  try {
    // Fetch all recipes
    const recipesRes = await fetch(`${adminUrl}/api/admin/nutrition`, {
      headers: { 'Cookie': cookie, 'User-Agent': 'TFG-Agent/1.0' }
    });
    const text = await recipesRes.text();
    let recipes = [];

    try {
      const parsed = JSON.parse(text);
      if (parsed.data && Array.isArray(parsed.data)) recipes = parsed.data;
      else if (Array.isArray(parsed)) recipes = parsed;
      else if (parsed.recipes && Array.isArray(parsed.recipes)) recipes = parsed.recipes;
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse recipes' });
    }

    // Filter recipes that have images
    const withImages = recipes.filter(r => {
      const img = r.image_url || r.imageUrl || r.image || r.recipe_image || '';
      return img && img.length > 10;
    });

    console.log(`[catalog-images] Found ${withImages.length} recipes with images out of ${recipes.length} total`);

    if (withImages.length === 0) {
      return res.status(200).json({ images: [], debug: 'No recipes with images found' });
    }

    // Pick 4 random recipes (or less if catalog is small)
    const count = Math.min(4, withImages.length);
    const shuffled = withImages.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    // Fetch each image and convert to base64
    const images = [];
    for (const recipe of selected) {
      const imgUrl = recipe.image_url || recipe.imageUrl || recipe.image || recipe.recipe_image || '';
      try {
        // If it's a relative URL, prepend admin URL
        const fullUrl = imgUrl.startsWith('http') ? imgUrl : `${adminUrl}${imgUrl}`;
        console.log(`[catalog-images] Fetching: ${recipe.recipe_name || recipe.name || 'unknown'} from ${fullUrl.substring(0, 80)}...`);

        const imgRes = await fetch(fullUrl, {
          headers: { 'Cookie': cookie, 'User-Agent': 'TFG-Agent/1.0' }
        });

        if (imgRes.ok) {
          const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
          const buffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          images.push({
            name: recipe.recipe_name || recipe.name || 'Recipe',
            dataUrl: `data:${contentType};base64,${base64}`
          });
          console.log(`[catalog-images] OK: ${recipe.recipe_name || recipe.name} (${Math.round(buffer.byteLength / 1024)}KB)`);
        } else {
          console.log(`[catalog-images] Failed to fetch image: ${imgRes.status}`);
        }
      } catch (imgErr) {
        console.log(`[catalog-images] Image fetch error: ${imgErr.message}`);
      }
    }

    console.log(`[catalog-images] Returning ${images.length} reference images`);
    return res.status(200).json({ images });

  } catch (e) {
    console.error('[catalog-images] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
