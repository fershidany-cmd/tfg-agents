// /api/create-recipe.js
// Creates a recipe in the TFG admin panel via FormData POST
// Also handles: fetching the DALL-E image and uploading it as a file
// Env vars required: TFG_ADMIN_URL, TFG_SESSION_TOKEN

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminUrl = process.env.TFG_ADMIN_URL || 'https://the-fitness-garage.com';
  const sessionToken = process.env.TFG_SESSION_TOKEN;

  if (!sessionToken) {
    return res.status(500).json({ error: 'TFG_SESSION_TOKEN not configured' });
  }

  const {
    recipe_name,
    recipe_categories,    // category UUID
    recipe_preptime,
    recipe_serving,
    recipe_calories,
    recipe_nutrition,     // protein in grams
    recipe_fat,
    recipe_carbs,
    ingredients,          // array of JSON strings: ["{\"title\":\"Section\",\"items\":[...]}"]
    instructions,         // array of JSON strings: ["{\"title\":\"Section\",\"steps\":[...]}"]
    image_url,            // DALL-E URL or external image URL to download and attach
    nutrition_uuid        // optional: for updating existing recipe
  } = req.body || {};

  // Validate required fields
  if (!recipe_name || !recipe_categories || !ingredients || !instructions) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['recipe_name', 'recipe_categories', 'ingredients', 'instructions']
    });
  }

  try {
    // Step 1: Get CSRF token from admin
    const csrfRes = await fetch(`${adminUrl}/api/auth/csrf`, {
      headers: {
        'Cookie': `__Secure-next-auth.session-token=${sessionToken}`,
        'User-Agent': 'TFG-Agent/1.0'
      }
    });
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;

    // Step 2: Download image from DALL-E URL if provided
    let imageBlob = null;
    let imageFilename = 'recipe.jpg';

    if (image_url) {
      try {
        const imgRes = await fetch(image_url);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          imageBlob = Buffer.from(arrayBuffer);

          // Determine extension from content-type
          const contentType = imgRes.headers.get('content-type') || 'image/png';
          const ext = contentType.includes('png') ? 'png' :
                      contentType.includes('webp') ? 'webp' :
                      contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
          imageFilename = `${recipe_name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}.${ext}`;
        }
      } catch (imgErr) {
        console.error('Failed to download image:', imgErr.message);
        // Continue without image — admin form allows saving without image
      }
    }

    // Step 3: Build FormData for the admin API
    // Using manual multipart/form-data construction for Vercel serverless
    const boundary = '----TFGAgentBoundary' + Date.now().toString(36);
    const parts = [];

    function addField(name, value) {
      parts.push(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${name}"\r\n\r\n` +
        `${value}\r\n`
      );
    }

    // Add text fields
    if (nutrition_uuid) addField('nutrition_uuid', nutrition_uuid);
    addField('recipe_name', recipe_name);
    addField('recipe_categories', recipe_categories);
    addField('recipe_preptime', String(recipe_preptime || 0));
    addField('recipe_serving', String(recipe_serving || 1));
    addField('recipe_calories', String(recipe_calories || 0));
    addField('recipe_nutrition', String(recipe_nutrition || 0));  // protein
    addField('recipe_fat', String(recipe_fat || 0));
    addField('recipe_carbs', String(recipe_carbs || 0));

    // Add ingredients and instructions as arrays of JSON strings
    const ingredientsArr = Array.isArray(ingredients) ? ingredients : [ingredients];
    const instructionsArr = Array.isArray(instructions) ? instructions : [instructions];

    for (const ing of ingredientsArr) {
      const val = typeof ing === 'string' ? ing : JSON.stringify(ing);
      addField('ingredients', val);
    }

    for (const inst of instructionsArr) {
      const val = typeof inst === 'string' ? inst : JSON.stringify(inst);
      addField('instructions', val);
    }

    // Add image file if available
    if (imageBlob) {
      parts.push(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${imageFilename}"\r\n` +
        `Content-Type: image/${imageFilename.split('.').pop()}\r\n\r\n`
      );
      // Image data will be appended as binary
    }

    // Construct body
    const textParts = parts.join('');
    const closing = `\r\n--${boundary}--\r\n`;

    let bodyBuffer;
    if (imageBlob) {
      const textBefore = Buffer.from(textParts, 'utf-8');
      const imgBuffer = imageBlob;
      const textAfter = Buffer.from(closing, 'utf-8');
      bodyBuffer = Buffer.concat([textBefore, imgBuffer, textAfter]);
    } else {
      bodyBuffer = Buffer.from(textParts + `--${boundary}--\r\n`, 'utf-8');
    }

    // Step 4: POST to admin API
    const createRes = await fetch(`${adminUrl}/api/admin/nutrition`, {
      method: 'POST',
      headers: {
        'Cookie': `__Secure-next-auth.session-token=${sessionToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'User-Agent': 'TFG-Agent/1.0',
        'x-csrf-token': csrfToken
      },
      body: bodyBuffer
    });

    const result = await createRes.json();

    if (!createRes.ok) {
      return res.status(createRes.status).json({
        error: 'Admin API returned error',
        status: createRes.status,
        details: result
      });
    }

    res.status(200).json({
      success: true,
      message: `Recipe "${recipe_name}" created successfully`,
      data: result
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
