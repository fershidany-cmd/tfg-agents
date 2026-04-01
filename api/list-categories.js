// /api/list-categories.js
// Fetches recipe categories from the TFG admin panel
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

  // Try both cookie names (NextAuth uses __Secure- prefix in production)
  const cookieVariants = [
    `__Secure-next-auth.session-token=${sessionToken}; next-auth.session-token=${sessionToken}`,
  ];

  try {
    // Try fetching all recipes and extract unique categories
    let recipes = null;

    for (const cookie of cookieVariants) {
      // Try /api/admin/nutrition first
      const recipesRes = await fetch(`${adminUrl}/api/admin/nutrition`, {
        headers: {
          'Cookie': cookie,
          'User-Agent': 'TFG-Agent/1.0'
        }
      });

      const text = await recipesRes.text();
      console.log('[list-categories] Status:', recipesRes.status, 'Response preview:', text.substring(0, 300));

      try {
        const parsed = JSON.parse(text);

        // Handle wrapped response format: {status, data, message}
        if (parsed.data && Array.isArray(parsed.data)) {
          recipes = parsed.data;
          break;
        }
        // Handle direct array response
        if (Array.isArray(parsed)) {
          recipes = parsed;
          break;
        }
        // Handle {recipes: [...]} format
        if (parsed.recipes && Array.isArray(parsed.recipes)) {
          recipes = parsed.recipes;
          break;
        }

        // If status is not 200 or got error, log and continue
        if (parsed.status === 404 || parsed.error) {
          console.log('[list-categories] Got error response, trying next approach...');
        }
      } catch (parseErr) {
        console.log('[list-categories] Parse error:', parseErr.message);
      }
    }

    // If still no recipes, try categories endpoint directly
    if (!recipes) {
      for (const cookie of cookieVariants) {
        const catRes = await fetch(`${adminUrl}/api/admin/nutrition/categories`, {
          headers: {
            'Cookie': cookie,
            'User-Agent': 'TFG-Agent/1.0'
          }
        });
        const catText = await catRes.text();
        console.log('[list-categories] Categories endpoint status:', catRes.status, 'Response:', catText.substring(0, 300));

        try {
          const catParsed = JSON.parse(catText);
          if (Array.isArray(catParsed)) {
            return res.status(200).json({ categories: catParsed });
          }
          if (catParsed.data && Array.isArray(catParsed.data)) {
            return res.status(200).json({ categories: catParsed.data });
          }
          if (catParsed.categories) {
            return res.status(200).json(catParsed);
          }
        } catch (e) {
          console.log('[list-categories] Categories parse error:', e.message);
        }
      }
    }

    if (!recipes || recipes.length === 0) {
      console.log('[list-categories] No recipes found, returning empty categories');
      return res.status(200).json({ categories: [], debug: 'No recipes returned from admin API' });
    }

    // Extract unique categories with their UUIDs
    const catMap = {};
    for (const r of recipes) {
      // Try multiple possible field names
      const catName = r.category_name || r.categoryName || r.category || '';
      const catId = r.recipe_category || r.recipe_categories || r.categoryId || r.categories || '';
      if (catName && !catMap[catName]) {
        catMap[catName] = catId;
      }
    }

    const categories = Object.entries(catMap).map(([name, id]) => ({
      name: name,
      id: id
    })).sort((a, b) => a.name.localeCompare(b.name));

    console.log('[list-categories] Found', categories.length, 'categories:', categories.map(c => c.name).join(', '));
    return res.status(200).json({ categories });

  } catch (e) {
    console.error('[list-categories] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
