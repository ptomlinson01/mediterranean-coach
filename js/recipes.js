/* recipes.js — the food.

   Every recipe carries an `effort` tier, which is the field that matters most:
   it is what lets a 12-hour day filter out anything that needs a stove. Nutrition
   is per serving and is a good-faith estimate, not lab-measured.

   effort:  none     assembly only, no heat
            quick    one pan, under 20 minutes
            standard a real dinner, 25-40 minutes
            project  batch cook — makes several servings on purpose

   aisle:   produce | protein | dairy | pantry | bakery | frozen
*/

export const AISLES = ['produce', 'protein', 'dairy', 'bakery', 'pantry', 'frozen'];

export const AISLE_LABEL = {
  produce: 'Produce', protein: 'Meat & fish', dairy: 'Dairy & eggs',
  bakery: 'Bakery', pantry: 'Pantry', frozen: 'Frozen'
};

export const RECIPES = [

  /* ───────────────────────── BREAKFAST ───────────────────────── */
  {
    id: 'b-yogurt-walnut', name: 'Greek Yogurt, Walnuts & Berries',
    meal: ['breakfast'], effort: 'none', minutes: 5, servings: 1,
    kcal: 340, protein: 28, carbs: 30, fat: 13, fiber: 5,
    tags: ['high-protein', 'no-cook', 'portable'],
    ing: [
      { n: 'Plain Greek yogurt, 2%', q: 1, u: 'cup', a: 'dairy' },
      { n: 'Walnut halves', q: 7, u: 'halves', a: 'pantry' },
      { n: 'Mixed berries', q: 0.75, u: 'cup', a: 'produce' },
      { n: 'Honey', q: 1, u: 'tsp', a: 'pantry' },
      { n: 'Cinnamon', q: 1, u: 'pinch', a: 'pantry' }
    ],
    steps: ['Yogurt in a bowl.', 'Berries and walnuts on top.', 'Honey, then cinnamon.'],
    why: '28 g of protein before 8am does more to kill the 10:30 vending-machine urge than any amount of willpower.'
  },
  {
    id: 'b-feta-scramble', name: 'Feta & Tomato Scramble',
    meal: ['breakfast'], effort: 'quick', minutes: 10, servings: 1,
    kcal: 360, protein: 26, carbs: 10, fat: 24, fiber: 3,
    tags: ['high-protein', 'one-pan'],
    ing: [
      { n: 'Eggs', q: 2, u: 'large', a: 'dairy' },
      { n: 'Egg whites', q: 2, u: 'large', a: 'dairy' },
      { n: 'Feta, crumbled', q: 1, u: 'oz', a: 'dairy' },
      { n: 'Cherry tomatoes', q: 0.5, u: 'cup', a: 'produce' },
      { n: 'Baby spinach', q: 1, u: 'cup', a: 'produce' },
      { n: 'Olive oil', q: 1, u: 'tsp', a: 'pantry' },
      { n: 'Dried oregano', q: 1, u: 'pinch', a: 'pantry' }
    ],
    steps: [
      'Oil in a nonstick pan, medium heat.',
      'Tomatoes 2 min until they slump, then spinach for 30 seconds.',
      'Beaten eggs in, stir slowly, pull them off while still soft.',
      'Off the heat, fold in feta and oregano.'
    ]
  },
  {
    id: 'b-overnight-oats', name: 'Fig & Almond Overnight Oats',
    meal: ['breakfast'], effort: 'none', minutes: 5, servings: 1,
    kcal: 390, protein: 20, carbs: 48, fat: 13, fiber: 8,
    tags: ['no-cook', 'portable', 'prep-ahead'],
    ing: [
      { n: 'Rolled oats', q: 0.5, u: 'cup', a: 'pantry' },
      { n: 'Plain Greek yogurt, 2%', q: 0.5, u: 'cup', a: 'dairy' },
      { n: 'Unsweetened almond milk', q: 0.5, u: 'cup', a: 'dairy' },
      { n: 'Dried figs, chopped', q: 2, u: 'whole', a: 'pantry' },
      { n: 'Sliced almonds', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Cinnamon', q: 0.25, u: 'tsp', a: 'pantry' }
    ],
    steps: ['Everything in a jar, stir, lid on.', 'Fridge overnight.', 'Eat cold, at your desk if you have to.'],
    why: 'Built the night before, which is the only reason it survives a 6am alarm.'
  },
  {
    id: 'b-cottage-toast', name: 'Cottage Cheese & Tomato on Rye',
    meal: ['breakfast'], effort: 'quick', minutes: 6, servings: 1,
    kcal: 330, protein: 26, carbs: 32, fat: 11, fiber: 6,
    tags: ['high-protein', 'quick'],
    ing: [
      { n: 'Rye or sourdough bread', q: 2, u: 'slices', a: 'bakery' },
      { n: 'Low-fat cottage cheese', q: 0.75, u: 'cup', a: 'dairy' },
      { n: 'Tomato', q: 1, u: 'medium', a: 'produce' },
      { n: 'Olive oil', q: 1, u: 'tsp', a: 'pantry' },
      { n: 'Dried oregano', q: 1, u: 'pinch', a: 'pantry' }
    ],
    steps: ['Toast the bread.', 'Cottage cheese, then sliced tomato.', 'Olive oil, oregano, plenty of black pepper.']
  },
  {
    id: 'b-salmon-crispbread', name: 'Smoked Salmon Crispbreads',
    meal: ['breakfast', 'snack'], effort: 'none', minutes: 4, servings: 1,
    kcal: 320, protein: 25, carbs: 24, fat: 13, fiber: 5,
    tags: ['no-cook', 'high-protein', 'fish'],
    ing: [
      { n: 'Rye crispbreads', q: 3, u: 'whole', a: 'bakery' },
      { n: 'Smoked salmon', q: 3, u: 'oz', a: 'protein' },
      { n: 'Plain Greek yogurt, 2%', q: 2, u: 'tbsp', a: 'dairy' },
      { n: 'Cucumber', q: 0.5, u: 'cup', a: 'produce' },
      { n: 'Lemon', q: 0.25, u: 'whole', a: 'produce' },
      { n: 'Dill', q: 1, u: 'pinch', a: 'produce' }
    ],
    steps: ['Yogurt on the crispbreads.', 'Salmon and cucumber over.', 'Lemon, dill, black pepper.']
  },
  {
    id: 'b-shakshuka', name: 'One-Pan Shakshuka',
    meal: ['breakfast', 'dinner'], effort: 'standard', minutes: 25, servings: 1,
    kcal: 400, protein: 24, carbs: 26, fat: 22, fiber: 7,
    tags: ['one-pan', 'vegetarian'],
    ing: [
      { n: 'Eggs', q: 2, u: 'large', a: 'dairy' },
      { n: 'Chopped tomatoes, tinned', q: 1, u: 'cup', a: 'pantry' },
      { n: 'Red pepper', q: 1, u: 'medium', a: 'produce' },
      { n: 'Onion', q: 0.5, u: 'medium', a: 'produce' },
      { n: 'Garlic', q: 2, u: 'cloves', a: 'produce' },
      { n: 'Olive oil', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Smoked paprika & cumin', q: 1, u: 'tsp', a: 'pantry' },
      { n: 'Feta, crumbled', q: 0.5, u: 'oz', a: 'dairy' }
    ],
    steps: [
      'Soften onion and pepper in the oil, 6–7 min.',
      'Garlic and spices, 1 min.',
      'Tomatoes in, simmer 8 min until it thickens.',
      'Make two wells, crack in the eggs, lid on, 5 min until whites set.',
      'Feta and black pepper over the top.'
    ],
    why: 'Also a perfectly good dinner. Eggs at night are not a failure of imagination, they are a Tuesday.'
  },
  {
    id: 'b-baked-oats-batch', name: 'Batch Baked Oats with Almonds',
    meal: ['breakfast'], effort: 'project', minutes: 35, servings: 4, batch: true,
    kcal: 375, protein: 25, carbs: 45, fat: 10, fiber: 7,
    tags: ['batch', 'prep-ahead', 'freezes'],
    ing: [
      { n: 'Rolled oats', q: 2, u: 'cups', a: 'pantry' },
      { n: 'Plain Greek yogurt, 2%', q: 1.5, u: 'cups', a: 'dairy' },
      { n: 'Eggs', q: 3, u: 'large', a: 'dairy' },
      { n: 'Unsweetened almond milk', q: 1, u: 'cup', a: 'dairy' },
      { n: 'Sliced almonds', q: 0.5, u: 'cup', a: 'pantry' },
      { n: 'Blueberries', q: 1, u: 'cup', a: 'produce' },
      { n: 'Honey', q: 2, u: 'tbsp', a: 'pantry' },
      { n: 'Cinnamon', q: 1, u: 'tsp', a: 'pantry' }
    ],
    steps: [
      'Oven to 350°F.',
      'Whisk eggs, yogurt, milk, honey and cinnamon.',
      'Stir in oats and half the almonds, pour into a baking dish.',
      'Berries and remaining almonds on top.',
      'Bake 30 min. Cut into four. Keeps five days, freezes well.'
    ],
    why: 'Sunday makes four breakfasts. Four fewer decisions in a week where you have already made too many.'
  },

  /* ─────────────────────────── LUNCH ─────────────────────────── */
  {
    id: 'l-tuna-white-bean', name: 'Tuna & White Bean Salad',
    meal: ['lunch'], effort: 'none', minutes: 7, servings: 1,
    kcal: 420, protein: 34, carbs: 34, fat: 16, fiber: 10,
    tags: ['no-cook', 'high-protein', 'portable', 'fish'],
    ing: [
      { n: 'Tuna in olive oil, tinned', q: 1, u: 'tin', a: 'pantry' },
      { n: 'Cannellini beans, tinned', q: 0.75, u: 'cup', a: 'pantry' },
      { n: 'Red onion', q: 0.25, u: 'small', a: 'produce' },
      { n: 'Cherry tomatoes', q: 0.75, u: 'cup', a: 'produce' },
      { n: 'Parsley', q: 2, u: 'tbsp', a: 'produce' },
      { n: 'Lemon', q: 0.5, u: 'whole', a: 'produce' },
      { n: 'Olive oil', q: 1, u: 'tbsp', a: 'pantry' }
    ],
    steps: ['Drain and rinse the beans.', 'Everything in a bowl, fork it together.', 'Lemon and oil, then let it sit ten minutes if you can.'],
    why: 'The single best thing you can build out of a cupboard. Keep the tins in your desk drawer at work.'
  },
  {
    id: 'l-greek-chicken-salad', name: 'Greek Salad with Chicken',
    meal: ['lunch', 'dinner'], effort: 'none', minutes: 10, servings: 1,
    kcal: 450, protein: 38, carbs: 18, fat: 25, fiber: 5,
    tags: ['no-cook', 'high-protein', 'uses-leftovers'],
    ing: [
      { n: 'Cooked chicken breast', q: 5, u: 'oz', a: 'protein' },
      { n: 'Cucumber', q: 1, u: 'cup', a: 'produce' },
      { n: 'Tomato', q: 1, u: 'large', a: 'produce' },
      { n: 'Red onion', q: 0.25, u: 'small', a: 'produce' },
      { n: 'Kalamata olives', q: 8, u: 'whole', a: 'pantry' },
      { n: 'Feta', q: 1, u: 'oz', a: 'dairy' },
      { n: 'Olive oil', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Red wine vinegar', q: 1, u: 'tbsp', a: 'pantry' }
    ],
    steps: ['Chop everything into big rough pieces — this is not a fine-dice salad.', 'Oil, vinegar, oregano, black pepper.', 'Feta on top in one slab, not crumbled.']
  },
  {
    id: 'l-lentil-soup', name: 'Lemon Lentil Soup',
    meal: ['lunch', 'dinner'], effort: 'project', minutes: 45, servings: 6, batch: true,
    kcal: 380, protein: 22, carbs: 48, fat: 11, fiber: 14,
    tags: ['batch', 'vegetarian', 'freezes', 'high-fiber'],
    ing: [
      { n: 'Brown or green lentils, dried', q: 2, u: 'cups', a: 'pantry' },
      { n: 'Onion', q: 1, u: 'large', a: 'produce' },
      { n: 'Carrots', q: 3, u: 'medium', a: 'produce' },
      { n: 'Celery', q: 3, u: 'stalks', a: 'produce' },
      { n: 'Garlic', q: 4, u: 'cloves', a: 'produce' },
      { n: 'Chopped tomatoes, tinned', q: 1, u: 'tin', a: 'pantry' },
      { n: 'Vegetable stock', q: 8, u: 'cups', a: 'pantry' },
      { n: 'Olive oil', q: 3, u: 'tbsp', a: 'pantry' },
      { n: 'Cumin', q: 2, u: 'tsp', a: 'pantry' },
      { n: 'Lemons', q: 2, u: 'whole', a: 'produce' },
      { n: 'Spinach', q: 4, u: 'cups', a: 'produce' }
    ],
    steps: [
      'Soften onion, carrot and celery in the oil, 10 min. Garlic and cumin, 1 min.',
      'Lentils, tomatoes and stock in. Simmer 30 min until the lentils give.',
      'Spinach at the end, then the juice of both lemons.',
      'The lemon is not optional — it is what stops six days of soup tasting like six days of soup.'
    ],
    why: '14 g of fibre a bowl, freezes in portions, and reheats in three minutes on the worst day of your week.'
  },
  {
    id: 'l-mezze-plate', name: 'Desk Mezze Plate',
    meal: ['lunch'], effort: 'none', minutes: 8, servings: 1,
    kcal: 440, protein: 24, carbs: 36, fat: 22, fiber: 9,
    tags: ['no-cook', 'portable', 'vegetarian'],
    ing: [
      { n: 'Hummus', q: 0.5, u: 'cup', a: 'dairy' },
      { n: 'Wholemeal pita', q: 1, u: 'whole', a: 'bakery' },
      { n: 'Feta', q: 1, u: 'oz', a: 'dairy' },
      { n: 'Cucumber', q: 1, u: 'cup', a: 'produce' },
      { n: 'Cherry tomatoes', q: 1, u: 'cup', a: 'produce' },
      { n: 'Kalamata olives', q: 8, u: 'whole', a: 'pantry' },
      { n: 'Boiled eggs', q: 2, u: 'large', a: 'dairy' }
    ],
    steps: ['Boil the eggs the night before with everything else you are prepping.', 'Assemble in a lunchbox in about four minutes.'],
    why: 'No microwave, no fridge queue, no reason to end up at the sandwich place.'
  },
  {
    id: 'l-chickpea-jar', name: 'Chickpea & Feta Jar Salad',
    meal: ['lunch'], effort: 'none', minutes: 8, servings: 1,
    kcal: 430, protein: 30, carbs: 40, fat: 16, fiber: 11,
    tags: ['no-cook', 'portable', 'prep-ahead', 'vegetarian'],
    ing: [
      { n: 'Chickpeas, tinned', q: 1, u: 'cup', a: 'pantry' },
      { n: 'Feta', q: 1.5, u: 'oz', a: 'dairy' },
      { n: 'Cucumber', q: 1, u: 'cup', a: 'produce' },
      { n: 'Cherry tomatoes', q: 1, u: 'cup', a: 'produce' },
      { n: 'Red onion', q: 0.25, u: 'small', a: 'produce' },
      { n: 'Olive oil', q: 2, u: 'tsp', a: 'pantry' },
      { n: 'Red wine vinegar', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Parsley', q: 2, u: 'tbsp', a: 'produce' }
    ],
    steps: ['Dressing in the bottom of the jar, then chickpeas, then veg, feta on top.', 'Shake it when you are ready to eat, not before.']
  },
  {
    id: 'l-sardine-toast', name: 'Sardines on Toast with Lemon',
    meal: ['lunch'], effort: 'quick', minutes: 8, servings: 1,
    kcal: 400, protein: 28, carbs: 30, fat: 19, fiber: 5,
    tags: ['quick', 'fish', 'high-protein'],
    ing: [
      { n: 'Sardines in olive oil, tinned', q: 1, u: 'tin', a: 'pantry' },
      { n: 'Sourdough bread', q: 2, u: 'slices', a: 'bakery' },
      { n: 'Lemon', q: 0.5, u: 'whole', a: 'produce' },
      { n: 'Parsley', q: 2, u: 'tbsp', a: 'produce' },
      { n: 'Red onion', q: 0.25, u: 'small', a: 'produce' },
      { n: 'Chilli flakes', q: 1, u: 'pinch', a: 'pantry' }
    ],
    steps: ['Toast hard.', 'Mash the sardines onto it with a fork, oil and all.', 'Lemon, parsley, raw onion, chilli.'],
    why: 'Cheapest omega-3 on earth. If you think you dislike sardines, try them once on properly toasted sourdough with a lot of lemon.'
  },
  {
    id: 'l-farro-veg-batch', name: 'Farro & Roast Vegetable Bowls',
    meal: ['lunch'], effort: 'project', minutes: 50, servings: 5, batch: true,
    kcal: 430, protein: 18, carbs: 58, fat: 14, fiber: 12,
    tags: ['batch', 'vegetarian', 'prep-ahead', 'high-fiber'],
    ing: [
      { n: 'Farro or pearl barley', q: 2, u: 'cups', a: 'pantry' },
      { n: 'Courgette', q: 2, u: 'medium', a: 'produce' },
      { n: 'Red peppers', q: 2, u: 'large', a: 'produce' },
      { n: 'Red onion', q: 1, u: 'large', a: 'produce' },
      { n: 'Aubergine', q: 1, u: 'medium', a: 'produce' },
      { n: 'Olive oil', q: 4, u: 'tbsp', a: 'pantry' },
      { n: 'Chickpeas, tinned', q: 2, u: 'cups', a: 'pantry' },
      { n: 'Lemons', q: 2, u: 'whole', a: 'produce' },
      { n: 'Feta', q: 5, u: 'oz', a: 'dairy' }
    ],
    steps: [
      'Oven to 425°F. Vegetables in big chunks, oil, salt, one tray, 30 min.',
      'Farro simmers alongside, 25 min, then drain.',
      'Combine with chickpeas and lemon juice while everything is still warm.',
      'Divide into five boxes. Feta goes on at eating time, not now.'
    ],
    why: 'Five lunches from one tray and one pot. Add whatever protein you already have to any box.'
  },
  {
    id: 'l-turkey-hummus-wrap', name: 'Turkey & Hummus Wrap',
    meal: ['lunch'], effort: 'none', minutes: 6, servings: 1,
    kcal: 410, protein: 32, carbs: 40, fat: 13, fiber: 8,
    tags: ['no-cook', 'portable', 'high-protein'],
    ing: [
      { n: 'Wholemeal tortilla, large', q: 1, u: 'whole', a: 'bakery' },
      { n: 'Sliced turkey breast', q: 4, u: 'oz', a: 'protein' },
      { n: 'Hummus', q: 3, u: 'tbsp', a: 'dairy' },
      { n: 'Roasted red peppers, jarred', q: 0.25, u: 'cup', a: 'pantry' },
      { n: 'Rocket or spinach', q: 1, u: 'cup', a: 'produce' },
      { n: 'Cucumber', q: 0.5, u: 'cup', a: 'produce' }
    ],
    steps: ['Hummus over the whole tortilla, right to the edges.', 'Everything else in a line down the middle.', 'Roll tight, cut on the diagonal.']
  },
  {
    id: 'l-egg-olive-salad', name: 'Egg, Olive & Rocket Salad',
    meal: ['lunch'], effort: 'none', minutes: 10, servings: 1,
    kcal: 390, protein: 24, carbs: 22, fat: 22, fiber: 6,
    tags: ['no-cook', 'vegetarian', 'prep-ahead'],
    ing: [
      { n: 'Boiled eggs', q: 3, u: 'large', a: 'dairy' },
      { n: 'Rocket', q: 2, u: 'cups', a: 'produce' },
      { n: 'Green olives', q: 10, u: 'whole', a: 'pantry' },
      { n: 'Butter beans, tinned', q: 0.5, u: 'cup', a: 'pantry' },
      { n: 'Olive oil', q: 2, u: 'tsp', a: 'pantry' },
      { n: 'Lemon', q: 0.5, u: 'whole', a: 'produce' }
    ],
    steps: ['Boil six eggs on Sunday and this becomes a two-minute lunch twice.', 'Quarter the eggs over everything else, dress, eat.']
  },

  /* ─────────────────────────── DINNER ────────────────────────── */
  {
    id: 'd-salmon-tray', name: 'Salmon Tray Bake with Tomatoes & Olives',
    meal: ['dinner'], effort: 'standard', minutes: 30, servings: 1,
    kcal: 520, protein: 40, carbs: 30, fat: 26, fiber: 7,
    tags: ['fish', 'one-pan', 'high-protein'],
    ing: [
      { n: 'Salmon fillet', q: 6, u: 'oz', a: 'protein' },
      { n: 'Baby potatoes', q: 6, u: 'oz', a: 'produce' },
      { n: 'Cherry tomatoes', q: 1, u: 'cup', a: 'produce' },
      { n: 'Kalamata olives', q: 8, u: 'whole', a: 'pantry' },
      { n: 'Olive oil', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Lemon', q: 0.5, u: 'whole', a: 'produce' },
      { n: 'Dried oregano', q: 1, u: 'tsp', a: 'pantry' }
    ],
    steps: [
      'Oven to 425°F. Halved potatoes, oil, salt — 15 min head start.',
      'Push them aside, salmon in the middle, tomatoes and olives around.',
      '12 more minutes. Lemon over everything at the table.'
    ],
    why: 'One tray, one wash-up. Oily fish twice a week is the part of this diet with the strongest evidence behind it.'
  },
  {
    id: 'd-sheet-chicken', name: 'Sheet-Pan Lemon Chicken & Vegetables',
    meal: ['dinner'], effort: 'project', minutes: 45, servings: 4, batch: true,
    kcal: 500, protein: 44, carbs: 32, fat: 22, fiber: 8,
    tags: ['batch', 'one-pan', 'high-protein'],
    ing: [
      { n: 'Chicken thighs, boneless skinless', q: 2, u: 'lb', a: 'protein' },
      { n: 'Baby potatoes', q: 1.5, u: 'lb', a: 'produce' },
      { n: 'Red onions', q: 2, u: 'large', a: 'produce' },
      { n: 'Courgette', q: 2, u: 'medium', a: 'produce' },
      { n: 'Lemons', q: 2, u: 'whole', a: 'produce' },
      { n: 'Garlic', q: 6, u: 'cloves', a: 'produce' },
      { n: 'Olive oil', q: 3, u: 'tbsp', a: 'pantry' },
      { n: 'Dried oregano', q: 1, u: 'tbsp', a: 'pantry' }
    ],
    steps: [
      'Oven to 425°F. Toss everything except the courgette with oil, oregano, garlic and the juice of one lemon.',
      'Two trays, not one crowded one — crowding steams instead of roasting.',
      '25 min, add courgette, 15 more.',
      'Second lemon over at the end. Portion three of the four into boxes immediately.'
    ],
    why: 'The anchor of the week. Tonight is dinner; the other three portions are Wednesday and Thursday already solved.'
  },
  {
    id: 'd-shrimp-tomato', name: 'Garlic Shrimp with Tomatoes & Spinach',
    meal: ['dinner'], effort: 'quick', minutes: 18, servings: 1,
    kcal: 450, protein: 38, carbs: 28, fat: 20, fiber: 6,
    tags: ['quick', 'fish', 'one-pan', 'high-protein'],
    ing: [
      { n: 'Raw shrimp, peeled', q: 7, u: 'oz', a: 'frozen' },
      { n: 'Cherry tomatoes', q: 1.5, u: 'cups', a: 'produce' },
      { n: 'Baby spinach', q: 3, u: 'cups', a: 'produce' },
      { n: 'Garlic', q: 3, u: 'cloves', a: 'produce' },
      { n: 'Olive oil', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Chilli flakes', q: 1, u: 'pinch', a: 'pantry' },
      { n: 'Wholemeal bread', q: 1, u: 'slice', a: 'bakery' },
      { n: 'Lemon', q: 0.5, u: 'whole', a: 'produce' }
    ],
    steps: [
      'Frozen shrimp thaw under cold running water in four minutes. Plan nothing further ahead than that.',
      'Garlic and chilli in the oil, 30 seconds. Tomatoes, 5 min, press them so they burst.',
      'Shrimp 3 min until just pink, spinach in to wilt.',
      'Lemon, and one slice of bread to take up the sauce.'
    ],
    why: 'Frozen shrimp is the fastest real protein there is. Keep a bag in the freezer permanently.'
  },
  {
    id: 'd-bean-tuna-skillet', name: 'White Bean & Tuna Skillet',
    meal: ['dinner'], effort: 'quick', minutes: 15, servings: 1,
    kcal: 470, protein: 34, carbs: 44, fat: 17, fiber: 12,
    tags: ['quick', 'one-pan', 'pantry-only', 'fish'],
    ing: [
      { n: 'Tuna in olive oil, tinned', q: 1, u: 'tin', a: 'pantry' },
      { n: 'Cannellini beans, tinned', q: 1, u: 'cup', a: 'pantry' },
      { n: 'Chopped tomatoes, tinned', q: 0.75, u: 'cup', a: 'pantry' },
      { n: 'Garlic', q: 2, u: 'cloves', a: 'produce' },
      { n: 'Baby spinach', q: 2, u: 'cups', a: 'produce' },
      { n: 'Olive oil', q: 2, u: 'tsp', a: 'pantry' },
      { n: 'Dried oregano', q: 1, u: 'tsp', a: 'pantry' }
    ],
    steps: [
      'Garlic in oil, 30 seconds.',
      'Tomatoes and beans, simmer 6 min, mash a few beans against the pan to thicken it.',
      'Spinach to wilt, tuna in at the very end, off the heat.'
    ],
    why: 'Every ingredient keeps in a cupboard for a year. This is your answer on the night the fridge is empty.'
  },
  {
    id: 'd-braised-chicken-olive', name: 'Braised Chicken with Olives & Lemon',
    meal: ['dinner'], effort: 'project', minutes: 70, servings: 6, batch: true,
    kcal: 490, protein: 42, carbs: 24, fat: 25, fiber: 6,
    tags: ['batch', 'freezes', 'high-protein'],
    ing: [
      { n: 'Chicken thighs, bone-in', q: 3, u: 'lb', a: 'protein' },
      { n: 'Onions', q: 2, u: 'large', a: 'produce' },
      { n: 'Garlic', q: 6, u: 'cloves', a: 'produce' },
      { n: 'Green olives', q: 1, u: 'cup', a: 'pantry' },
      { n: 'Chopped tomatoes, tinned', q: 1, u: 'tin', a: 'pantry' },
      { n: 'Chicken stock', q: 2, u: 'cups', a: 'pantry' },
      { n: 'Lemons', q: 2, u: 'whole', a: 'produce' },
      { n: 'Olive oil', q: 2, u: 'tbsp', a: 'pantry' },
      { n: 'Cumin & paprika', q: 2, u: 'tsp', a: 'pantry' }
    ],
    steps: [
      'Brown the chicken hard on both sides. Do not rush this, it is most of the flavour.',
      'Onions in the same pot, 8 min. Garlic and spices, 1 min.',
      'Tomatoes, stock, olives, chicken back in. Lid on, 45 min at a bare simmer.',
      'Lemon juice and zest at the end.'
    ],
    why: 'Better on day two than day one, which makes it the rare batch cook nobody resents by Thursday.'
  },
  {
    id: 'd-cod-puttanesca', name: 'Cod Puttanesca',
    meal: ['dinner'], effort: 'standard', minutes: 28, servings: 1,
    kcal: 430, protein: 38, carbs: 22, fat: 21, fiber: 6,
    tags: ['fish', 'one-pan', 'high-protein'],
    ing: [
      { n: 'Cod or haddock fillet', q: 7, u: 'oz', a: 'protein' },
      { n: 'Chopped tomatoes, tinned', q: 1, u: 'cup', a: 'pantry' },
      { n: 'Kalamata olives', q: 10, u: 'whole', a: 'pantry' },
      { n: 'Capers', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Anchovy fillets', q: 3, u: 'whole', a: 'pantry' },
      { n: 'Garlic', q: 3, u: 'cloves', a: 'produce' },
      { n: 'Olive oil', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Green beans', q: 1.5, u: 'cups', a: 'produce' }
    ],
    steps: [
      'Anchovies and garlic in the oil over low heat until the anchovies dissolve. They will not taste fishy, they taste like depth.',
      'Tomatoes, olives, capers, 10 min.',
      'Lay the cod in the sauce, lid on, 8 min.',
      'Green beans steamed alongside.'
    ]
  },
  {
    id: 'd-turkey-meatballs', name: 'Turkey Meatballs in Tomato Sauce',
    meal: ['dinner'], effort: 'project', minutes: 55, servings: 5, batch: true,
    kcal: 480, protein: 40, carbs: 33, fat: 21, fiber: 7,
    tags: ['batch', 'freezes', 'high-protein', 'family'],
    ing: [
      { n: 'Ground turkey, 93%', q: 2, u: 'lb', a: 'protein' },
      { n: 'Egg', q: 1, u: 'large', a: 'dairy' },
      { n: 'Wholemeal breadcrumbs', q: 0.75, u: 'cup', a: 'bakery' },
      { n: 'Parmesan, grated', q: 0.5, u: 'cup', a: 'dairy' },
      { n: 'Passata', q: 2, u: 'jars', a: 'pantry' },
      { n: 'Onion', q: 1, u: 'large', a: 'produce' },
      { n: 'Garlic', q: 5, u: 'cloves', a: 'produce' },
      { n: 'Olive oil', q: 2, u: 'tbsp', a: 'pantry' },
      { n: 'Dried oregano & basil', q: 1, u: 'tbsp', a: 'pantry' }
    ],
    steps: [
      'Mix turkey, egg, breadcrumbs, parmesan, half the garlic. Roll about 25 balls.',
      'Brown them in batches, set aside.',
      'Onion and rest of garlic in the pot, 8 min. Passata and herbs in.',
      'Meatballs back in, simmer 25 min.',
      'Serve over vegetables tonight, freeze the rest in portions of five.'
    ],
    why: 'Freezes better than anything else here, and it is the meal that works when you are cooking for other people who are not on a diet.'
  },
  {
    id: 'd-omelette-salad', name: 'Big Vegetable Omelette & Salad',
    meal: ['dinner'], effort: 'quick', minutes: 14, servings: 1,
    kcal: 420, protein: 28, carbs: 16, fat: 27, fiber: 5,
    tags: ['quick', 'vegetarian', 'one-pan'],
    ing: [
      { n: 'Eggs', q: 3, u: 'large', a: 'dairy' },
      { n: 'Feta', q: 1, u: 'oz', a: 'dairy' },
      { n: 'Courgette', q: 0.5, u: 'medium', a: 'produce' },
      { n: 'Cherry tomatoes', q: 0.75, u: 'cup', a: 'produce' },
      { n: 'Rocket', q: 2, u: 'cups', a: 'produce' },
      { n: 'Olive oil', q: 2, u: 'tsp', a: 'pantry' },
      { n: 'Lemon', q: 0.5, u: 'whole', a: 'produce' }
    ],
    steps: ['Grated courgette into the pan first, 3 min to drive off water.', 'Eggs in, feta over, lid on 4 min.', 'Dressed rocket on the side, not underneath.']
  },
  {
    id: 'd-pork-fennel', name: 'Pork Loin with Fennel & Apple',
    meal: ['dinner'], effort: 'standard', minutes: 35, servings: 2,
    kcal: 500, protein: 44, carbs: 26, fat: 24, fiber: 7,
    tags: ['one-pan', 'high-protein'],
    ing: [
      { n: 'Pork loin chops', q: 12, u: 'oz', a: 'protein' },
      { n: 'Fennel bulb', q: 1, u: 'large', a: 'produce' },
      { n: 'Apple', q: 1, u: 'medium', a: 'produce' },
      { n: 'Red onion', q: 1, u: 'medium', a: 'produce' },
      { n: 'Olive oil', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Fennel seeds', q: 1, u: 'tsp', a: 'pantry' },
      { n: 'Chicken stock', q: 0.5, u: 'cup', a: 'pantry' }
    ],
    steps: [
      'Sear the pork 3 min a side, take it out and let it rest.',
      'Fennel, onion, apple into the pan with the seeds, 12 min until caught at the edges.',
      'Stock in to lift the pan, pork back on top for 4 min.'
    ]
  },
  {
    id: 'd-eggplant-chickpea', name: 'Aubergine & Chickpea Stew',
    meal: ['dinner', 'lunch'], effort: 'project', minutes: 50, servings: 6, batch: true,
    kcal: 420, protein: 16, carbs: 52, fat: 16, fiber: 15,
    tags: ['batch', 'vegetarian', 'freezes', 'high-fiber'],
    ing: [
      { n: 'Aubergines', q: 2, u: 'large', a: 'produce' },
      { n: 'Chickpeas, tinned', q: 3, u: 'cups', a: 'pantry' },
      { n: 'Chopped tomatoes, tinned', q: 2, u: 'tins', a: 'pantry' },
      { n: 'Onions', q: 2, u: 'large', a: 'produce' },
      { n: 'Garlic', q: 5, u: 'cloves', a: 'produce' },
      { n: 'Olive oil', q: 4, u: 'tbsp', a: 'pantry' },
      { n: 'Cumin & cinnamon', q: 2, u: 'tsp', a: 'pantry' },
      { n: 'Parsley', q: 1, u: 'cup', a: 'produce' }
    ],
    steps: [
      'Aubergine in big cubes, roast at 425°F with half the oil, 25 min.',
      'Onions and garlic softening in the rest of the oil meanwhile, then spices.',
      'Tomatoes and chickpeas, 15 min. Roast aubergine folded in at the end.',
      'A lot of parsley. Yogurt on top of each bowl if you want.'
    ],
    why: '15 g of fibre and no meat at all — worth two or three dinners a week purely for what it does to your cholesterol numbers.'
  },
  {
    id: 'd-pantry-bowl', name: 'Ten-Minute Pantry Bowl',
    meal: ['dinner', 'lunch'], effort: 'none', minutes: 7, servings: 1,
    kcal: 430, protein: 30, carbs: 42, fat: 16, fiber: 12,
    tags: ['no-cook', 'pantry-only', 'emergency'],
    ing: [
      { n: 'Chickpeas, tinned', q: 1, u: 'cup', a: 'pantry' },
      { n: 'Tuna in olive oil, tinned', q: 1, u: 'tin', a: 'pantry' },
      { n: 'Roasted red peppers, jarred', q: 0.5, u: 'cup', a: 'pantry' },
      { n: 'Kalamata olives', q: 8, u: 'whole', a: 'pantry' },
      { n: 'Lemon', q: 0.5, u: 'whole', a: 'produce' },
      { n: 'Olive oil', q: 1, u: 'tsp', a: 'pantry' }
    ],
    steps: ['Open four things.', 'Tip them in a bowl.', 'Lemon, oil, black pepper. Eat standing up if that is the kind of day it was.'],
    why: 'This exists specifically for the 13-hour day. It is not a great dinner and it is not supposed to be — it is the thing that stops the takeaway.'
  },
  {
    id: 'd-salmon-butterbean', name: 'Smoked Salmon & Butter Bean Plate',
    meal: ['dinner', 'lunch'], effort: 'none', minutes: 6, servings: 1,
    kcal: 460, protein: 36, carbs: 34, fat: 18, fiber: 11,
    tags: ['no-cook', 'emergency', 'fish', 'high-protein'],
    ing: [
      { n: 'Smoked salmon', q: 4, u: 'oz', a: 'protein' },
      { n: 'Butter beans, tinned', q: 1, u: 'cup', a: 'pantry' },
      { n: 'Rocket', q: 2, u: 'cups', a: 'produce' },
      { n: 'Cherry tomatoes', q: 1, u: 'cup', a: 'produce' },
      { n: 'Olive oil', q: 2, u: 'tsp', a: 'pantry' },
      { n: 'Lemon', q: 0.5, u: 'whole', a: 'produce' },
      { n: 'Rye crispbreads', q: 2, u: 'whole', a: 'bakery' }
    ],
    steps: ['Beans, rocket and tomatoes dressed with the oil and lemon.', 'Salmon draped over. Crispbreads on the side.'],
    why: '36 g of protein and not one thing switched on. This is what a 13-hour day should look like.'
  },
  {
    id: 'd-chicken-hummus-plate', name: 'Shop-Chicken & Hummus Plate',
    meal: ['dinner', 'lunch'], effort: 'none', minutes: 7, servings: 1,
    kcal: 490, protein: 40, carbs: 36, fat: 20, fiber: 9,
    tags: ['no-cook', 'emergency', 'high-protein'],
    ing: [
      { n: 'Cooked rotisserie chicken', q: 5, u: 'oz', a: 'protein' },
      { n: 'Hummus', q: 0.5, u: 'cup', a: 'dairy' },
      { n: 'Wholemeal pita', q: 1, u: 'whole', a: 'bakery' },
      { n: 'Cucumber', q: 1, u: 'cup', a: 'produce' },
      { n: 'Cherry tomatoes', q: 1, u: 'cup', a: 'produce' },
      { n: 'Kalamata olives', q: 8, u: 'whole', a: 'pantry' },
      { n: 'Lemon', q: 0.5, u: 'whole', a: 'produce' }
    ],
    steps: ['Pull the chicken off the bird with your hands.', 'Everything on one plate. Lemon over the lot.'],
    why: 'A supermarket rotisserie chicken on the way home is not cheating. It is two dinners and a lunch that will actually happen.'
  },
  {
    id: 'd-mackerel-beetroot', name: 'Mackerel, Beetroot & Feta',
    meal: ['dinner', 'lunch'], effort: 'none', minutes: 5, servings: 1,
    kcal: 470, protein: 32, carbs: 30, fat: 24, fiber: 8,
    tags: ['no-cook', 'emergency', 'fish', 'pantry-only'],
    ing: [
      { n: 'Mackerel fillets, tinned', q: 1, u: 'tin', a: 'pantry' },
      { n: 'Cooked beetroot, vacuum-packed', q: 1, u: 'cup', a: 'produce' },
      { n: 'Feta', q: 1, u: 'oz', a: 'dairy' },
      { n: 'Puy or green lentils, tinned', q: 0.75, u: 'cup', a: 'pantry' },
      { n: 'Rocket', q: 2, u: 'cups', a: 'produce' },
      { n: 'Olive oil', q: 1, u: 'tsp', a: 'pantry' },
      { n: 'Red wine vinegar', q: 1, u: 'tbsp', a: 'pantry' }
    ],
    steps: ['Lentils and beetroot dressed with oil and vinegar.', 'Rocket, then the mackerel broken over in big flakes, feta last.'],
    why: 'Three tins and a packet. Keep the makings of this permanently and the takeaway app stops winning.'
  },
  {
    id: 'd-grilled-fish-greens', name: 'Grilled Fish with Garlic Greens',
    meal: ['dinner'], effort: 'quick', minutes: 20, servings: 1,
    kcal: 440, protein: 42, carbs: 18, fat: 22, fiber: 7,
    tags: ['quick', 'fish', 'high-protein', 'low-carb'],
    ing: [
      { n: 'Sea bass or trout fillet', q: 7, u: 'oz', a: 'protein' },
      { n: 'Chard or kale', q: 4, u: 'cups', a: 'produce' },
      { n: 'Garlic', q: 3, u: 'cloves', a: 'produce' },
      { n: 'Butter beans, tinned', q: 0.5, u: 'cup', a: 'pantry' },
      { n: 'Olive oil', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Lemon', q: 1, u: 'whole', a: 'produce' }
    ],
    steps: ['Fish skin-side down in a hot dry pan, 5 min, flip for 90 seconds.', 'Greens and garlic in oil in a second pan, 5 min, beans folded through.', 'Lemon over both.']
  },

  /* ─────────────────────────── SNACKS ────────────────────────── */
  {
    id: 's-yogurt-honey', name: 'Greek Yogurt with Honey',
    meal: ['snack'], effort: 'none', minutes: 2, servings: 1,
    kcal: 150, protein: 16, carbs: 16, fat: 3, fiber: 0,
    tags: ['no-cook', 'high-protein'],
    ing: [
      { n: 'Plain Greek yogurt, 0%', q: 0.75, u: 'cup', a: 'dairy' },
      { n: 'Honey', q: 1, u: 'tsp', a: 'pantry' },
      { n: 'Cinnamon', q: 1, u: 'pinch', a: 'pantry' }
    ],
    steps: ['That is the whole recipe.']
  },
  {
    id: 's-almonds-olives', name: 'Almonds & Olives',
    meal: ['snack'], effort: 'none', minutes: 1, servings: 1,
    kcal: 185, protein: 6, carbs: 7, fat: 15, fiber: 4,
    tags: ['no-cook', 'portable', 'desk-drawer'],
    ing: [
      { n: 'Almonds', q: 20, u: 'whole', a: 'pantry' },
      { n: 'Green olives', q: 6, u: 'whole', a: 'pantry' }
    ],
    steps: ['Count the almonds. Twenty, not a handful — a handful is sixty.'],
    why: 'Keep a measured bag in your work drawer and your car. This is the hour-nine snack that protects the drive home.'
  },
  {
    id: 's-hummus-veg', name: 'Hummus & Raw Vegetables',
    meal: ['snack'], effort: 'none', minutes: 5, servings: 1,
    kcal: 170, protein: 7, carbs: 18, fat: 8, fiber: 6,
    tags: ['no-cook', 'vegetarian'],
    ing: [
      { n: 'Hummus', q: 3, u: 'tbsp', a: 'dairy' },
      { n: 'Carrots', q: 1, u: 'medium', a: 'produce' },
      { n: 'Cucumber', q: 1, u: 'cup', a: 'produce' },
      { n: 'Red pepper', q: 0.5, u: 'medium', a: 'produce' }
    ],
    steps: ['Cut the vegetables on Sunday and keep them in water in the fridge. Uncut vegetables do not get eaten.']
  },
  {
    id: 's-apple-almond-butter', name: 'Apple & Almond Butter',
    meal: ['snack'], effort: 'none', minutes: 2, servings: 1,
    kcal: 190, protein: 5, carbs: 24, fat: 9, fiber: 5,
    tags: ['no-cook', 'portable'],
    ing: [
      { n: 'Apple', q: 1, u: 'medium', a: 'produce' },
      { n: 'Almond butter', q: 1, u: 'tbsp', a: 'pantry' }
    ],
    steps: ['Slice the apple, one level tablespoon of almond butter.']
  },
  {
    id: 's-dark-chocolate', name: 'Dark Chocolate & Mint Tea',
    meal: ['snack'], effort: 'none', minutes: 3, servings: 1,
    kcal: 95, protein: 1, carbs: 9, fat: 6, fiber: 2,
    tags: ['no-cook', 'evening', 'craving'],
    ing: [
      { n: 'Dark chocolate, 70%+', q: 2, u: 'squares', a: 'pantry' },
      { n: 'Mint or chamomile tea', q: 1, u: 'bag', a: 'pantry' }
    ],
    steps: ['Make the tea first.', 'Two squares, eaten slowly, with the tea.', 'Then the kitchen is closed.'],
    why: 'A planned 95-calorie treat at 9pm is what prevents the unplanned 600-calorie one at 10pm. This is a tool, not a cheat.'
  },
  {
    id: 's-cottage-tomato', name: 'Cottage Cheese & Tomatoes',
    meal: ['snack'], effort: 'none', minutes: 3, servings: 1,
    kcal: 160, protein: 20, carbs: 10, fat: 5, fiber: 2,
    tags: ['no-cook', 'high-protein'],
    ing: [
      { n: 'Low-fat cottage cheese', q: 0.75, u: 'cup', a: 'dairy' },
      { n: 'Cherry tomatoes', q: 0.75, u: 'cup', a: 'produce' },
      { n: 'Olive oil', q: 1, u: 'tsp', a: 'pantry' },
      { n: 'Dried oregano', q: 1, u: 'pinch', a: 'pantry' }
    ],
    steps: ['Tomatoes and oregano over the cottage cheese, oil, a lot of black pepper.'],
    why: 'The highest protein-per-calorie snack in the app. Use it on days the plan says you are short.'
  },
  {
    id: 's-tuna-crispbread', name: 'Tuna on Crispbread',
    meal: ['snack'], effort: 'none', minutes: 4, servings: 1,
    kcal: 175, protein: 18, carbs: 14, fat: 6, fiber: 3,
    tags: ['no-cook', 'high-protein', 'desk-drawer'],
    ing: [
      { n: 'Tuna in water, tinned', q: 0.5, u: 'tin', a: 'pantry' },
      { n: 'Rye crispbreads', q: 2, u: 'whole', a: 'bakery' },
      { n: 'Lemon', q: 0.25, u: 'whole', a: 'produce' }
    ],
    steps: ['Fork the tuna onto the crispbreads with lemon and pepper.']
  },
  {
    id: 's-orange-pistachio', name: 'Orange & Pistachios',
    meal: ['snack'], effort: 'none', minutes: 3, servings: 1,
    kcal: 165, protein: 5, carbs: 20, fat: 8, fiber: 5,
    tags: ['no-cook', 'portable'],
    ing: [
      { n: 'Orange', q: 1, u: 'large', a: 'produce' },
      { n: 'Pistachios, shelled', q: 1, u: 'oz', a: 'pantry' }
    ],
    steps: ['Peel the orange properly and sit down with it.'],
    why: 'Fruit is the Mediterranean dessert. Not a compromise dessert — the actual one.'
  }
];


export const BY_ID = Object.fromEntries(RECIPES.map(r => [r.id, r]));

/** Compact one-line-per-recipe index for the assistant's system prompt. */
export function recipeIndex() {
  return RECIPES.map(r =>
    `${r.id} | ${r.name} | ${r.meal.join('/')} | ${r.effort} | ${r.minutes}min | ${r.kcal}kcal | P${r.protein}g | F${r.fiber}g${r.batch ? ` | BATCH makes ${r.servings}` : ''}`
  ).join('\n');
}

export function searchRecipes(query, { meal, effort, maxMinutes } = {}) {
  const q = (query || '').trim().toLowerCase();
  return RECIPES.filter(r => {
    if (meal && !r.meal.includes(meal)) return false;
    if (effort && r.effort !== effort) return false;
    if (maxMinutes && r.minutes > maxMinutes) return false;
    if (!q) return true;
    return (r.name + ' ' + r.tags.join(' ') + ' ' + r.ing.map(i => i.n).join(' '))
      .toLowerCase().includes(q);
  });
}
