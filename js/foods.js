/* foods.js — a small food database that works with no signal.

   Not a nutrition encyclopaedia. These are the things a man in his fifties
   in an American kitchen, office or restaurant actually eats and does not
   want to look up: the proteins, the carbs, the fruit, the drinks, and the
   restaurant orders that turn up on a Thursday. Every entry is ONE sensible
   serving in the unit a person would say out loud, with calories and
   protein rounded to something honest. Online search (Open Food Facts)
   sits behind this for packaged and branded items. */

export const FOODS = [
  /* eggs and dairy */
  { n: 'Egg, large', u: '1 egg', k: 72, p: 6, t: 'protein breakfast' },
  { n: 'Eggs, 2 scrambled with butter', u: '2 eggs', k: 200, p: 13, t: 'protein breakfast' },
  { n: 'Egg whites', u: '1/2 cup', k: 63, p: 13, t: 'protein breakfast' },
  { n: 'Greek yogurt, plain nonfat', u: '1 cup', k: 130, p: 23, t: 'protein breakfast snack' },
  { n: 'Greek yogurt, plain whole milk', u: '1 cup', k: 220, p: 20, t: 'protein breakfast snack' },
  { n: 'Cottage cheese, 2%', u: '1 cup', k: 180, p: 24, t: 'protein snack' },
  { n: 'Cheddar cheese', u: '1 oz', k: 115, p: 7, t: 'dairy' },
  { n: 'String cheese', u: '1 stick', k: 80, p: 7, t: 'snack dairy' },
  { n: 'Milk, 2%', u: '1 cup', k: 122, p: 8, t: 'dairy drink' },
  { n: 'Butter', u: '1 tbsp', k: 100, p: 0, t: 'fat' },

  /* poultry and meat */
  { n: 'Chicken breast, grilled', u: '6 oz', k: 280, p: 52, t: 'protein chicken' },
  { n: 'Chicken thigh, roasted, skinless', u: '2 thighs', k: 300, p: 38, t: 'protein chicken' },
  { n: 'Rotisserie chicken, breast meat', u: '1 cup', k: 230, p: 40, t: 'protein chicken' },
  { n: 'Rotisserie chicken, with skin', u: '1/4 chicken', k: 400, p: 44, t: 'protein chicken' },
  { n: 'Turkey breast, deli', u: '4 oz', k: 120, p: 24, t: 'protein lunch' },
  { n: 'Ground turkey, 93%', u: '4 oz cooked', k: 200, p: 25, t: 'protein' },
  { n: 'Ground beef, 90% lean', u: '4 oz cooked', k: 230, p: 30, t: 'protein beef' },
  { n: 'Ground beef, 80%', u: '4 oz cooked', k: 290, p: 27, t: 'protein beef' },
  { n: 'Steak, sirloin', u: '8 oz', k: 460, p: 60, t: 'protein beef' },
  { n: 'Steak, ribeye', u: '10 oz', k: 720, p: 60, t: 'protein beef restaurant' },
  { n: 'Filet mignon', u: '6 oz', k: 380, p: 48, t: 'protein beef restaurant' },
  { n: 'Pork chop, boneless', u: '6 oz', k: 330, p: 46, t: 'protein pork' },
  { n: 'Pork tenderloin', u: '6 oz', k: 250, p: 44, t: 'protein pork' },
  { n: 'Bacon', u: '3 slices', k: 130, p: 9, t: 'pork breakfast' },
  { n: 'Ham, deli', u: '4 oz', k: 140, p: 20, t: 'protein lunch pork' },
  { n: 'Sausage, breakfast links', u: '3 links', k: 220, p: 9, t: 'pork breakfast' },
  { n: 'Hot dog with bun', u: '1', k: 300, p: 11, t: 'restaurant' },

  /* fish */
  { n: 'Salmon, baked', u: '6 oz', k: 350, p: 40, t: 'protein fish' },
  { n: 'Tuna, canned in water', u: '1 can (5 oz)', k: 120, p: 27, t: 'protein fish lunch' },
  { n: 'Tuna salad with mayo', u: '1/2 cup', k: 190, p: 16, t: 'fish lunch' },
  { n: 'Shrimp, cooked', u: '6 oz', k: 170, p: 36, t: 'protein fish' },
  { n: 'Cod or tilapia, baked', u: '6 oz', k: 180, p: 38, t: 'protein fish' },
  { n: 'Fish, fried', u: '6 oz', k: 400, p: 30, t: 'fish restaurant' },
  { n: 'Sardines, canned in oil', u: '1 can', k: 190, p: 22, t: 'protein fish' },
  { n: 'Salmon roll (sushi)', u: '6 pieces', k: 300, p: 12, t: 'sushi restaurant' },
  { n: 'Tuna roll (sushi)', u: '6 pieces', k: 240, p: 12, t: 'sushi restaurant' },
  { n: 'California roll', u: '8 pieces', k: 330, p: 9, t: 'sushi restaurant' },
  { n: 'Spicy tuna roll', u: '8 pieces', k: 350, p: 13, t: 'sushi restaurant' },
  { n: 'Poke bowl, salmon, store-bought', u: '1 bowl', k: 600, p: 30, t: 'sushi lunch restaurant' },
  { n: 'Sashimi', u: '8 pieces', k: 200, p: 34, t: 'sushi restaurant protein' },

  /* beans, nuts */
  { n: 'Black beans, canned', u: '1/2 cup', k: 110, p: 7, t: 'beans' },
  { n: 'Chickpeas, canned', u: '1/2 cup', k: 130, p: 7, t: 'beans' },
  { n: 'Lentils, cooked', u: '1 cup', k: 230, p: 18, t: 'beans' },
  { n: 'Hummus', u: '1/4 cup', k: 100, p: 5, t: 'snack beans' },
  { n: 'Almonds', u: '1 oz (23)', k: 165, p: 6, t: 'snack nuts' },
  { n: 'Peanuts', u: '1 oz', k: 165, p: 7, t: 'snack nuts' },
  { n: 'Peanut butter', u: '2 tbsp', k: 190, p: 8, t: 'snack nuts' },
  { n: 'Walnuts', u: '1 oz', k: 185, p: 4, t: 'snack nuts' },
  { n: 'Trail mix', u: '1/4 cup', k: 175, p: 5, t: 'snack nuts' },

  /* carbs */
  { n: 'White rice, cooked', u: '1 cup', k: 205, p: 4, t: 'carb rice' },
  { n: 'Brown rice, cooked', u: '1 cup', k: 215, p: 5, t: 'carb rice' },
  { n: 'Pasta, cooked', u: '1 cup', k: 220, p: 8, t: 'carb pasta' },
  { n: 'Potato, baked, medium', u: '1', k: 160, p: 4, t: 'carb potato' },
  { n: 'Sweet potato, baked, medium', u: '1', k: 105, p: 2, t: 'carb potato' },
  { n: 'French fries', u: 'medium', k: 365, p: 4, t: 'carb potato restaurant' },
  { n: 'Mashed potatoes', u: '1 cup', k: 240, p: 4, t: 'carb potato' },
  { n: 'Bread, whole wheat', u: '1 slice', k: 80, p: 4, t: 'carb bread' },
  { n: 'Bread, white', u: '1 slice', k: 75, p: 2, t: 'carb bread' },
  { n: 'Bagel, plain', u: '1', k: 290, p: 11, t: 'carb bread breakfast' },
  { n: 'Bagel with cream cheese', u: '1', k: 390, p: 13, t: 'carb bread breakfast' },
  { n: 'Tortilla, flour, 8 inch', u: '1', k: 145, p: 4, t: 'carb bread' },
  { n: 'Oatmeal, cooked', u: '1 cup', k: 160, p: 6, t: 'carb breakfast' },
  { n: 'Cereal with milk', u: '1 bowl', k: 250, p: 8, t: 'carb breakfast' },
  { n: 'Granola', u: '1/2 cup', k: 250, p: 6, t: 'carb breakfast' },
  { n: 'Crackers', u: '6', k: 100, p: 2, t: 'snack carb' },
  { n: 'Pretzels', u: '1 oz', k: 110, p: 3, t: 'snack carb' },
  { n: 'Potato chips', u: '1 oz (15)', k: 155, p: 2, t: 'snack carb' },
  { n: 'Tortilla chips', u: '1 oz (12)', k: 140, p: 2, t: 'snack carb' },
  { n: 'Popcorn, microwave', u: '1 bag', k: 400, p: 8, t: 'snack carb' },
  { n: 'Dinner roll', u: '1', k: 90, p: 3, t: 'carb bread restaurant' },
  { n: 'Restaurant bread with butter', u: '2 pieces', k: 260, p: 6, t: 'carb bread restaurant' },

  /* vegetables */
  { n: 'Salad greens', u: '2 cups', k: 15, p: 1, t: 'veg salad' },
  { n: 'Broccoli, steamed', u: '1 cup', k: 55, p: 4, t: 'veg' },
  { n: 'Green beans', u: '1 cup', k: 45, p: 2, t: 'veg' },
  { n: 'Mixed vegetables, roasted with oil', u: '1 cup', k: 130, p: 3, t: 'veg' },
  { n: 'Carrots, raw', u: '1 cup', k: 50, p: 1, t: 'veg snack' },
  { n: 'Corn on the cob', u: '1 ear', k: 90, p: 3, t: 'veg carb' },
  { n: 'Avocado', u: '1/2', k: 120, p: 1, t: 'veg fat' },
  { n: 'Guacamole', u: '1/4 cup', k: 90, p: 1, t: 'veg fat restaurant' },
  { n: 'Olive oil', u: '1 tbsp', k: 120, p: 0, t: 'fat' },
  { n: 'Salad dressing, ranch', u: '2 tbsp', k: 130, p: 0, t: 'fat salad' },
  { n: 'Salad dressing, vinaigrette', u: '2 tbsp', k: 90, p: 0, t: 'fat salad' },
  { n: 'Mayonnaise', u: '1 tbsp', k: 90, p: 0, t: 'fat' },
  { n: 'Ketchup', u: '1 tbsp', k: 20, p: 0, t: 'condiment' },

  /* fruit */
  { n: 'Banana, medium', u: '1', k: 105, p: 1, t: 'fruit snack' },
  { n: 'Apple, medium', u: '1', k: 95, p: 0, t: 'fruit snack' },
  { n: 'Orange', u: '1', k: 65, p: 1, t: 'fruit snack' },
  { n: 'Berries', u: '1 cup', k: 70, p: 1, t: 'fruit snack' },
  { n: 'Grapes', u: '1 cup', k: 105, p: 1, t: 'fruit snack' },
  { n: 'Watermelon', u: '2 cups', k: 90, p: 2, t: 'fruit snack' },
  { n: 'Orange juice', u: '8 oz', k: 110, p: 2, t: 'fruit drink' },

  /* drinks */
  { n: 'Coffee, black', u: '12 oz', k: 5, p: 0, t: 'drink coffee' },
  { n: 'Coffee with cream and sugar', u: '12 oz', k: 80, p: 1, t: 'drink coffee' },
  { n: 'Latte, whole milk', u: '16 oz', k: 230, p: 12, t: 'drink coffee' },
  { n: 'Soda', u: '12 oz can', k: 140, p: 0, t: 'drink' },
  { n: 'Diet soda', u: '12 oz can', k: 0, p: 0, t: 'drink' },
  { n: 'Sports drink', u: '20 oz', k: 130, p: 0, t: 'drink' },
  { n: 'Protein shake, ready to drink', u: '1 bottle', k: 160, p: 30, t: 'drink protein snack' },
  { n: 'Protein powder, whey', u: '1 scoop', k: 120, p: 24, t: 'protein snack' },
  { n: 'Wine, red', u: '5 oz glass', k: 125, p: 0, t: 'alcohol drink' },
  { n: 'Wine, white', u: '5 oz glass', k: 120, p: 0, t: 'alcohol drink' },
  { n: 'Wine, generous pour', u: '8 oz', k: 200, p: 0, t: 'alcohol drink' },
  { n: 'Beer, regular', u: '12 oz', k: 150, p: 1, t: 'alcohol drink' },
  { n: 'Beer, light', u: '12 oz', k: 100, p: 1, t: 'alcohol drink' },
  { n: 'Beer, IPA', u: '16 oz', k: 290, p: 2, t: 'alcohol drink' },
  { n: 'Whiskey, bourbon or vodka', u: '1.5 oz shot', k: 100, p: 0, t: 'alcohol drink' },
  { n: 'Cocktail, margarita', u: '1', k: 280, p: 0, t: 'alcohol drink' },
  { n: 'Cocktail, old fashioned', u: '1', k: 190, p: 0, t: 'alcohol drink' },

  /* restaurant and takeout */
  { n: 'Cheeseburger, restaurant', u: '1', k: 750, p: 40, t: 'restaurant beef' },
  { n: 'Cheeseburger, fast food, single', u: '1', k: 400, p: 20, t: 'restaurant beef' },
  { n: 'Burger with fries, restaurant', u: '1 plate', k: 1200, p: 45, t: 'restaurant beef' },
  { n: 'Pizza, cheese', u: '1 large slice', k: 290, p: 12, t: 'restaurant' },
  { n: 'Pizza, pepperoni', u: '1 large slice', k: 330, p: 14, t: 'restaurant' },
  { n: 'Chicken burrito', u: '1', k: 950, p: 45, t: 'restaurant chicken' },
  { n: 'Burrito bowl, chicken', u: '1 bowl', k: 700, p: 45, t: 'restaurant chicken' },
  { n: 'Tacos, chicken, street style', u: '3', k: 450, p: 30, t: 'restaurant chicken' },
  { n: 'Chicken sandwich, fried', u: '1', k: 600, p: 30, t: 'restaurant chicken' },
  { n: 'Chicken sandwich, grilled', u: '1', k: 420, p: 35, t: 'restaurant chicken' },
  { n: 'Chicken wings', u: '6', k: 500, p: 35, t: 'restaurant chicken' },
  { n: 'Caesar salad with chicken', u: '1 entree', k: 650, p: 45, t: 'restaurant salad chicken' },
  { n: 'Cobb salad', u: '1 entree', k: 700, p: 40, t: 'restaurant salad' },
  { n: 'Chicken noodle soup', u: '1 bowl', k: 180, p: 12, t: 'restaurant soup' },
  { n: 'Chili', u: '1 bowl', k: 330, p: 24, t: 'restaurant soup beef' },
  { n: 'Turkey sandwich, deli', u: '1', k: 450, p: 30, t: 'lunch restaurant' },
  { n: 'Club sandwich', u: '1', k: 700, p: 40, t: 'lunch restaurant' },
  { n: 'Sub sandwich, 6 inch, turkey', u: '1', k: 350, p: 25, t: 'lunch restaurant' },
  { n: 'Sub sandwich, footlong, Italian', u: '1', k: 1000, p: 45, t: 'lunch restaurant' },
  { n: 'Pad thai, chicken', u: '1 entree', k: 900, p: 35, t: 'restaurant chicken' },
  { n: 'Fried rice, chicken', u: '1 entree', k: 800, p: 30, t: 'restaurant chicken rice' },
  { n: 'General Tso chicken with rice', u: '1 entree', k: 1200, p: 40, t: 'restaurant chicken rice' },
  { n: 'Spaghetti with meat sauce', u: '1 entree', k: 700, p: 30, t: 'restaurant pasta beef' },
  { n: 'Fettuccine alfredo', u: '1 entree', k: 1100, p: 30, t: 'restaurant pasta' },
  { n: 'Steak dinner with potato', u: '1 plate', k: 900, p: 65, t: 'restaurant beef' },
  { n: 'Grilled salmon dinner', u: '1 plate', k: 650, p: 45, t: 'restaurant fish' },
  { n: 'Fish and chips', u: '1 plate', k: 950, p: 40, t: 'restaurant fish' },
  { n: 'BBQ brisket plate', u: '1 plate', k: 1000, p: 55, t: 'restaurant beef' },
  { n: 'Breakfast tacos', u: '2', k: 500, p: 22, t: 'breakfast restaurant' },
  { n: 'Pancakes with syrup', u: '3', k: 550, p: 10, t: 'breakfast restaurant' },
  { n: 'Egg McMuffin style sandwich', u: '1', k: 310, p: 17, t: 'breakfast restaurant' },
  { n: 'Breakfast burrito', u: '1', k: 650, p: 25, t: 'breakfast restaurant' },

  /* sweets */
  { n: 'Chocolate bar', u: '1.5 oz', k: 230, p: 3, t: 'sweet snack' },
  { n: 'Cookie, bakery', u: '1 large', k: 220, p: 2, t: 'sweet snack' },
  { n: 'Ice cream', u: '1 cup', k: 280, p: 5, t: 'sweet dessert' },
  { n: 'Cheesecake', u: '1 slice', k: 400, p: 7, t: 'sweet dessert restaurant' },
  { n: 'Brownie', u: '1', k: 230, p: 3, t: 'sweet dessert' },
  { n: 'Donut, glazed', u: '1', k: 260, p: 3, t: 'sweet breakfast' },
  { n: 'Muffin, bakery', u: '1', k: 420, p: 6, t: 'sweet breakfast' },
  { n: 'Dark chocolate', u: '2 squares', k: 110, p: 1, t: 'sweet snack' },
  { n: 'Candy, gummy', u: '10 pieces', k: 90, p: 0, t: 'sweet snack' }
];

/* ── search ────────────────────────────────────────────────────── */

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);

/**
 * Rank by how many query words hit the name, with a bonus for a prefix
 * match on the first word. Tags count for half. Returns at most `limit`.
 */
export function searchFoods(q, limit = 12) {
  const words = norm(q);
  if (!words.length) return [];
  const scored = [];
  for (const f of FOODS) {
    const name = f.n.toLowerCase(), tags = f.t;
    let score = 0;
    for (const w of words) {
      if (name.startsWith(w)) score += 3;
      else if (name.includes(w)) score += 2;
      else if (tags.includes(w)) score += 1;
      else { score = 0; break; }               // every word must land somewhere
    }
    if (score) scored.push({ score, f });
  }
  return scored.sort((a, b) => b.score - a.score || a.f.n.localeCompare(b.f.n)).slice(0, limit).map(x => x.f);
}

/* ── online: Open Food Facts ───────────────────────────────────── */

/* Packaged and branded things. Free, no key, CORS-friendly. Numbers are
   per 100 g in the database; a serving size is used when the label has one. */
export async function searchOnline(q, signal) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,brands,nutriments,serving_size,serving_quantity`;
  const res = await fetch(url, { signal, headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Open Food Facts ${res.status}`);
  const j = await res.json();
  const out = [];
  for (const pr of j.products || []) {
    const nu = pr.nutriments || {};
    const k100 = Number(nu['energy-kcal_100g'] ?? nu['energy-kcal'] ?? 0);
    const p100 = Number(nu.proteins_100g ?? 0);
    if (!pr.product_name || !k100) continue;
    const grams = Number(pr.serving_quantity) || 100;
    const unit = pr.serving_size ? String(pr.serving_size) : '100 g';
    out.push({
      n: `${pr.product_name}${pr.brands ? ` (${String(pr.brands).split(',')[0].trim()})` : ''}`,
      u: unit,
      k: Math.round(k100 * grams / 100),
      p: Math.round(p100 * grams / 100),
      t: 'online'
    });
  }
  return out;
}
