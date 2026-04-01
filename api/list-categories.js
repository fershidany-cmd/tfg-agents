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

  try {
    // Fetch categories from admin API
    const response = await fetch(`${adminUrl}/api/admin/nutrition/categories`, {
      headers: {
        'Cookie': `__Secure-next-auth.session-token=${sessionToken}`,
        'User-Agent': 'TFG-Agent/1.0'
      }
    });

    if (!response.ok) {
      // Fallback: fetch all recipes and extract unique categories
      const recipesRes = await fetch(`${adminUrl}/api/admin/nutrition`, {
        headers: {
          'Cookie': `__Secure-next-auth.session-token=${sessionToken}`,
          'User-Agent': 'TFG-Agent/1.0'
        }
      });

      if (!recipesRes.ok) {
        return res.status(recipesRes.status).json({ error: 'Failed to fetch from admin API. Session token may be expired.' });
      }

      const recipes = await recipesRes.json();
      const list = Array.isArray(recipes) ? recipes : (recipes.data || []);

      // Extract unique categories with their UUIDs
      const catMap = {};
      for (const r of list) {
        const catName = r.category_name || '';
        const catId = r.recipe_category || r.categories || '';
        if (catName && !catMap[catName]) {
          catMap[catName] = catId;
        }
      }

      const categories = Object.entries(catMap).map(([name, id]) => ({
        name: name,
        id: id
      })).sort((a, b) => a.name.localeCompare(b.name));

      return res.status(200).json({ categories });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
