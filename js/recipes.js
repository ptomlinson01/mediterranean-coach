/* recipes.js — the food.

   Ground rules for anything that goes in this file:

   1. Every ingredient is sold in a normal American supermarket, under the name
      used here. No specialty aisle, no hunting, no "where do I find farro".
   2. American names. Zucchini, not courgette. Canned, not tinned.
   3. Built on what actually gets eaten: chicken, ground beef and turkey, eggs,
      canned tuna, salmon, shrimp, pork, and a lot of vegetables. Rice, potatoes,
      bread and pasta are in, at sane portions.

   The eating pattern underneath is still the one with the best evidence behind
   it — vegetables at the center, olive oil as the main fat, fish and chicken
   over red meat, beans and whole grains, fruit for dessert. It just does not
   announce itself, and it does not require a single unfamiliar item.

   effort:  none     assembly only, nothing gets cooked
            quick    one pan, under 20 minutes
            standard a real dinner, 25-40 minutes
            project  batch cook, makes several servings on purpose

   aisle:   produce | protein | dairy | bakery | pantry | frozen

   Nutrition is per serving and is a good-faith estimate, not lab-measured.
*/

export const AISLES = ['produce', 'protein', 'dairy', 'bakery', 'pantry', 'frozen'];

export const AISLE_LABEL = {
  produce: 'Produce', protein: 'Meat & seafood', dairy: 'Dairy & eggs',
  bakery: 'Bread', pantry: 'Pantry', frozen: 'Frozen'
};

export const RECIPES = [

  /* ───────────────────────── BREAKFAST ───────────────────────── */
  {
    id: 'b-eggs-toast', name: 'Scrambled Eggs & Toast',
    meal: ['breakfast'], effort: 'quick', minutes: 10, servings: 1,
    kcal: 390, protein: 28, carbs: 30, fat: 18, fiber: 5,
    tags: ['high-protein', 'quick'],
    ing: [
      { n: 'Eggs', q: 3, u: 'large', a: 'dairy' },
      { n: 'Whole wheat bread', q: 2, u: 'slices', a: 'bakery' },
      { n: 'Shredded cheddar', q: 0.25, u: 'cup', a: 'dairy' },
      { n: 'Baby spinach', q: 1, u: 'cup', a: 'produce' },
      { n: 'Olive oil', q: 1, u: 'tsp', a: 'pantry' }
    ],
    steps: [
      'Spinach into the oiled pan for 30 seconds, just to wilt.',
      'Beaten eggs in, stir slowly over medium-low, pull them off while still soft.',
      'Cheese folded in off the heat. Toast alongside.'
    ],
    why: '28 grams of protein before you leave the house does more against a mid-morning vending machine run than willpower ever will.'
  },
  {
    id: 'b-yogurt-berries', name: 'Greek Yogurt, Berries & Almonds',
    meal: ['breakfast'], effort: 'none', minutes: 4, servings: 1,
    kcal: 335, protein: 28, carbs: 28, fat: 12, fiber: 5,
    tags: ['no-cook', 'high-protein', 'portable'],
    ing: [
      { n: 'Plain Greek yogurt', q: 1, u: 'cup', a: 'dairy' },
      { n: 'Blueberries or strawberries', q: 1, u: 'cup', a: 'produce' },
      { n: 'Sliced almonds', q: 2, u: 'tbsp', a: 'pantry' },
      { n: 'Honey', q: 1, u: 'tsp', a: 'pantry' }
    ],
    steps: ['Yogurt in a bowl, berries and almonds on top, honey over.'],
    why: 'Buy plain, not flavored. Flavored yogurt carries about four teaspoons of sugar you would never add yourself.'
  },
  {
    id: 'b-oatmeal-pb', name: 'Oatmeal with Peanut Butter & Banana',
    meal: ['breakfast'], effort: 'quick', minutes: 6, servings: 1,
    kcal: 395, protein: 18, carbs: 52, fat: 13, fiber: 8,
    tags: ['quick', 'high-fiber'],
    ing: [
      { n: 'Old-fashioned oats', q: 0.5, u: 'cup', a: 'pantry' },
      { n: 'Milk', q: 1, u: 'cup', a: 'dairy' },
      { n: 'Peanut butter', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Banana', q: 1, u: 'medium', a: 'produce' },
      { n: 'Cinnamon', q: 1, u: 'pinch', a: 'pantry' }
    ],
    steps: ['Oats and milk in the microwave, 2 minutes.', 'Peanut butter stirred in while hot, banana sliced over, cinnamon.'],
    why: 'Made with milk instead of water, it carries real protein. Made with water it is just warm carbohydrate and you are hungry by ten.'
  },
  {
    id: 'b-cottage-fruit', name: 'Cottage Cheese & Fruit',
    meal: ['breakfast', 'snack'], effort: 'none', minutes: 3, servings: 1,
    kcal: 255, protein: 28, carbs: 24, fat: 5, fiber: 2,
    tags: ['no-cook', 'high-protein'],
    ing: [
      { n: 'Cottage cheese, low-fat', q: 1, u: 'cup', a: 'dairy' },
      { n: 'Pineapple or peaches', q: 1, u: 'cup', a: 'produce' }
    ],
    steps: ['Bowl. Spoon. Done.'],
    why: 'The best protein-per-calorie item in the whole app. Use it on days the plan says you are running short.'
  },
  {
    id: 'b-egg-muffins', name: 'Egg Muffins',
    meal: ['breakfast'], effort: 'project', minutes: 35, servings: 6, batch: true,
    kcal: 275, protein: 24, carbs: 8, fat: 16, fiber: 2,
    tags: ['batch', 'prep-ahead', 'high-protein', 'portable'],
    ing: [
      { n: 'Eggs', q: 12, u: 'large', a: 'dairy' },
      { n: 'Bell pepper', q: 1, u: 'large', a: 'produce' },
      { n: 'Baby spinach', q: 3, u: 'cups', a: 'produce' },
      { n: 'Shredded cheddar', q: 1, u: 'cup', a: 'dairy' },
      { n: 'Turkey sausage or ham, diced', q: 8, u: 'oz', a: 'protein' },
      { n: 'Olive oil', q: 1, u: 'tbsp', a: 'pantry' }
    ],
    steps: [
      'Oven to 350°F. Grease a 12-cup muffin tin well.',
      'Beat the eggs. Stir in everything else, chopped small.',
      'Fill the cups about three-quarters. Bake 22 minutes until set.',
      'Two per serving. Keeps five days, reheats in 40 seconds.'
    ],
    why: 'Twenty minutes on Sunday buys six breakfasts you do not have to think about. Six fewer decisions in a week that already has too many.'
  },
  {
    id: 'b-breakfast-burrito', name: 'Breakfast Burrito',
    meal: ['breakfast'], effort: 'quick', minutes: 12, servings: 1,
    kcal: 420, protein: 30, carbs: 34, fat: 18, fiber: 6,
    tags: ['quick', 'high-protein', 'portable'],
    ing: [
      { n: 'Eggs', q: 3, u: 'large', a: 'dairy' },
      { n: 'Whole wheat tortilla, large', q: 1, u: 'whole', a: 'bakery' },
      { n: 'Black beans, canned', q: 0.33, u: 'cup', a: 'pantry' },
      { n: 'Shredded cheddar', q: 0.25, u: 'cup', a: 'dairy' },
      { n: 'Salsa', q: 2, u: 'tbsp', a: 'pantry' },
      { n: 'Bell pepper', q: 0.5, u: 'medium', a: 'produce' }
    ],
    steps: ['Pepper in the pan first, then the eggs.', 'Everything down the middle of the tortilla, roll it tight.', 'Wrap in foil and it survives the commute.']
  },
  {
    id: 'b-avocado-egg-toast', name: 'Avocado Toast with Eggs',
    meal: ['breakfast'], effort: 'quick', minutes: 10, servings: 1,
    kcal: 415, protein: 22, carbs: 32, fat: 22, fiber: 9,
    tags: ['quick'],
    ing: [
      { n: 'Eggs', q: 2, u: 'large', a: 'dairy' },
      { n: 'Whole wheat bread', q: 2, u: 'slices', a: 'bakery' },
      { n: 'Avocado', q: 0.5, u: 'medium', a: 'produce' },
      { n: 'Cherry tomatoes', q: 0.5, u: 'cup', a: 'produce' },
      { n: 'Lemon', q: 0.25, u: 'whole', a: 'produce' }
    ],
    steps: ['Toast hard. Mash the avocado onto it with lemon and salt.', 'Two eggs fried or poached on top. Tomatoes on the side.']
  },
  {
    id: 'b-smoothie', name: 'Berry Protein Smoothie',
    meal: ['breakfast'], effort: 'none', minutes: 4, servings: 1,
    kcal: 340, protein: 32, carbs: 34, fat: 8, fiber: 6,
    tags: ['no-cook', 'high-protein', 'portable'],
    ing: [
      { n: 'Frozen mixed berries', q: 1, u: 'cup', a: 'frozen' },
      { n: 'Plain Greek yogurt', q: 0.75, u: 'cup', a: 'dairy' },
      { n: 'Milk', q: 0.75, u: 'cup', a: 'dairy' },
      { n: 'Banana', q: 0.5, u: 'medium', a: 'produce' },
      { n: 'Peanut butter', q: 1, u: 'tsp', a: 'pantry' }
    ],
    steps: ['Everything in the blender, 30 seconds.'],
    why: 'For mornings where chewing feels like too much. Drink it in the car if you have to.'
  },

  /* ─────────────────────────── LUNCH ─────────────────────────── */
  {
    id: 'l-tuna-salad', name: 'Tuna Salad Plate',
    meal: ['lunch', 'dinner'], effort: 'none', minutes: 7, servings: 1,
    kcal: 380, protein: 34, carbs: 24, fat: 16, fiber: 6,
    tags: ['no-cook', 'high-protein', 'portable', 'pantry-only'],
    ing: [
      { n: 'Canned tuna', q: 1, u: 'can', a: 'pantry' },
      { n: 'Mayonnaise', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Celery', q: 1, u: 'stalk', a: 'produce' },
      { n: 'Red onion', q: 0.25, u: 'small', a: 'produce' },
      { n: 'Whole wheat crackers', q: 12, u: 'whole', a: 'pantry' },
      { n: 'Baby carrots', q: 1, u: 'cup', a: 'produce' },
      { n: 'Lemon', q: 0.25, u: 'whole', a: 'produce' }
    ],
    steps: ['Drain the tuna properly, then fork it up with the mayo, chopped celery and onion.', 'Lemon, black pepper. Crackers and carrots alongside.'],
    why: 'Keep two cans in your desk drawer permanently. This is the lunch that happens when nothing else was planned.'
  },
  {
    id: 'l-chicken-caesar', name: 'Chicken Caesar Salad',
    meal: ['lunch', 'dinner'], effort: 'none', minutes: 8, servings: 1,
    kcal: 430, protein: 42, carbs: 16, fat: 22, fiber: 4,
    tags: ['no-cook', 'high-protein', 'uses-leftovers'],
    ing: [
      { n: 'Cooked chicken breast', q: 6, u: 'oz', a: 'protein' },
      { n: 'Romaine lettuce', q: 4, u: 'cups', a: 'produce' },
      { n: 'Caesar dressing', q: 2, u: 'tbsp', a: 'pantry' },
      { n: 'Parmesan, grated', q: 2, u: 'tbsp', a: 'dairy' },
      { n: 'Cherry tomatoes', q: 1, u: 'cup', a: 'produce' }
    ],
    steps: ['Chop the romaine, toss with the dressing first so it coats.', 'Chicken and tomatoes on top, parmesan last.'],
    why: 'Two tablespoons of dressing, measured. Poured straight from the bottle it is usually five, and that is 200 calories you did not notice.'
  },
  {
    id: 'l-turkey-sandwich', name: 'Turkey & Swiss Sandwich',
    meal: ['lunch'], effort: 'none', minutes: 6, servings: 1,
    kcal: 415, protein: 34, carbs: 38, fat: 14, fiber: 6,
    tags: ['no-cook', 'portable', 'high-protein'],
    ing: [
      { n: 'Sliced turkey breast, deli', q: 5, u: 'oz', a: 'protein' },
      { n: 'Whole wheat bread', q: 2, u: 'slices', a: 'bakery' },
      { n: 'Swiss cheese', q: 1, u: 'slice', a: 'dairy' },
      { n: 'Mustard', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Lettuce', q: 2, u: 'leaves', a: 'produce' },
      { n: 'Tomato', q: 3, u: 'slices', a: 'produce' }
    ],
    steps: ['Mustard, not mayo — that swap alone is 90 calories.', 'Pile the turkey higher than feels normal. That is the point.']
  },
  {
    id: 'l-chicken-rice-bowl', name: 'Chicken & Rice Bowl',
    meal: ['lunch', 'dinner'], effort: 'none', minutes: 8, servings: 1,
    kcal: 450, protein: 40, carbs: 46, fat: 12, fiber: 6,
    tags: ['no-cook', 'uses-leftovers', 'high-protein'],
    ing: [
      { n: 'Cooked chicken breast', q: 6, u: 'oz', a: 'protein' },
      { n: 'Cooked rice', q: 1, u: 'cup', a: 'pantry' },
      { n: 'Frozen broccoli', q: 1.5, u: 'cups', a: 'frozen' },
      { n: 'Soy sauce', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Olive oil', q: 1, u: 'tsp', a: 'pantry' }
    ],
    steps: ['Broccoli in the microwave, 3 minutes.', 'Rice and chicken on top, soy sauce and oil over the lot.'],
    why: 'Built entirely from things already cooked. Microwave rice pouches are fine — nobody is grading you.'
  },
  {
    id: 'l-poke-sushi', name: 'Store-Bought Sushi or Poke Bowl',
    meal: ['lunch', 'dinner'], effort: 'none', minutes: 5, servings: 1,
    kcal: 410, protein: 30, carbs: 50, fat: 10, fiber: 4,
    tags: ['no-cook', 'bought', 'emergency'],
    ing: [
      { n: 'Sushi or poke bowl, store-bought', q: 1, u: 'container', a: 'protein' },
      { n: 'Edamame', q: 0.5, u: 'cup', a: 'frozen' }
    ],
    steps: [
      'Pick the one built on salmon, tuna or shrimp with plain rice.',
      'Skip anything labeled crunchy, tempura, spicy mayo or dynamite — that is where the calories hide.',
      'Light soy sauce. Edamame on the side if you want it more filling.'
    ],
    why: 'One of the genuinely good things you can buy already made. Lean fish, portioned rice, almost no added fat.'
  },
  {
    id: 'l-big-salad-egg', name: 'Big Salad with Eggs & Cheese',
    meal: ['lunch'], effort: 'none', minutes: 10, servings: 1,
    kcal: 390, protein: 26, carbs: 18, fat: 24, fiber: 6,
    tags: ['no-cook', 'vegetarian', 'prep-ahead'],
    ing: [
      { n: 'Hard-boiled eggs', q: 3, u: 'large', a: 'dairy' },
      { n: 'Mixed salad greens', q: 4, u: 'cups', a: 'produce' },
      { n: 'Cucumber', q: 1, u: 'cup', a: 'produce' },
      { n: 'Cherry tomatoes', q: 1, u: 'cup', a: 'produce' },
      { n: 'Shredded cheddar', q: 0.25, u: 'cup', a: 'dairy' },
      { n: 'Olive oil', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Red wine vinegar', q: 1, u: 'tbsp', a: 'pantry' }
    ],
    steps: ['Boil a dozen eggs on Sunday and this is a five-minute lunch three times over.', 'Oil and vinegar, salt, plenty of black pepper.']
  },
  {
    id: 'l-chicken-wrap', name: 'Chicken & Ranch Wrap',
    meal: ['lunch'], effort: 'none', minutes: 7, servings: 1,
    kcal: 430, protein: 36, carbs: 36, fat: 16, fiber: 5,
    tags: ['no-cook', 'portable', 'uses-leftovers'],
    ing: [
      { n: 'Cooked chicken breast', q: 5, u: 'oz', a: 'protein' },
      { n: 'Whole wheat tortilla, large', q: 1, u: 'whole', a: 'bakery' },
      { n: 'Ranch dressing, light', q: 1.5, u: 'tbsp', a: 'pantry' },
      { n: 'Romaine lettuce', q: 1, u: 'cup', a: 'produce' },
      { n: 'Shredded carrots', q: 0.5, u: 'cup', a: 'produce' },
      { n: 'Shredded cheddar', q: 2, u: 'tbsp', a: 'dairy' }
    ],
    steps: ['Dressing spread edge to edge, everything else in a line down the middle.', 'Roll it tight, cut on the diagonal.']
  },
  {
    id: 'l-taco-salad', name: 'Ground Beef Taco Salad',
    meal: ['lunch', 'dinner'], effort: 'quick', minutes: 15, servings: 1,
    kcal: 445, protein: 38, carbs: 24, fat: 22, fiber: 7,
    tags: ['quick', 'high-protein', 'one-pan'],
    ing: [
      { n: 'Ground beef, 90% lean', q: 5, u: 'oz', a: 'protein' },
      { n: 'Taco seasoning', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Black beans, canned', q: 0.5, u: 'cup', a: 'pantry' },
      { n: 'Romaine lettuce', q: 3, u: 'cups', a: 'produce' },
      { n: 'Salsa', q: 3, u: 'tbsp', a: 'pantry' },
      { n: 'Shredded cheddar', q: 0.25, u: 'cup', a: 'dairy' },
      { n: 'Greek yogurt', q: 2, u: 'tbsp', a: 'dairy' }
    ],
    steps: [
      'Brown the beef, drain the fat off properly, add the seasoning and a splash of water.',
      'Beans in to warm through.',
      'Over the lettuce with salsa, cheese, and yogurt where sour cream would go.'
    ],
    why: 'Plain Greek yogurt instead of sour cream is the single easiest swap in this app. Same tang, triple the protein, a third of the fat.'
  },
  {
    id: 'l-chicken-soup', name: 'Chicken & Rice Soup',
    meal: ['lunch', 'dinner'], effort: 'project', minutes: 45, servings: 6, batch: true,
    kcal: 370, protein: 32, carbs: 38, fat: 10, fiber: 6,
    tags: ['batch', 'freezes', 'high-protein'],
    ing: [
      { n: 'Chicken thighs, boneless skinless', q: 2, u: 'lb', a: 'protein' },
      { n: 'Chicken broth', q: 8, u: 'cups', a: 'pantry' },
      { n: 'Rice, uncooked', q: 1, u: 'cup', a: 'pantry' },
      { n: 'Carrots', q: 4, u: 'medium', a: 'produce' },
      { n: 'Celery', q: 4, u: 'stalks', a: 'produce' },
      { n: 'Onion', q: 1, u: 'large', a: 'produce' },
      { n: 'Garlic', q: 4, u: 'cloves', a: 'produce' },
      { n: 'Olive oil', q: 2, u: 'tbsp', a: 'pantry' },
      { n: 'Lemon', q: 1, u: 'whole', a: 'produce' }
    ],
    steps: [
      'Soften onion, carrot and celery in the oil, 8 minutes. Garlic for one more.',
      'Broth and whole chicken thighs in. Simmer 20 minutes.',
      'Pull the chicken out, shred it with two forks, put it back. Rice in, 15 more minutes.',
      'Juice of the whole lemon at the end. It is what stops six days of soup tasting like six days of soup.'
    ],
    why: 'Freezes in portions and reheats in three minutes on the worst evening of your week.'
  },
  {
    id: 'l-shrimp-salad', name: 'Shrimp Cocktail Salad',
    meal: ['lunch'], effort: 'none', minutes: 8, servings: 1,
    kcal: 335, protein: 34, carbs: 18, fat: 14, fiber: 5,
    tags: ['no-cook', 'high-protein'],
    ing: [
      { n: 'Cooked shrimp', q: 6, u: 'oz', a: 'frozen' },
      { n: 'Mixed salad greens', q: 3, u: 'cups', a: 'produce' },
      { n: 'Avocado', q: 0.33, u: 'medium', a: 'produce' },
      { n: 'Cocktail sauce', q: 2, u: 'tbsp', a: 'pantry' },
      { n: 'Cucumber', q: 1, u: 'cup', a: 'produce' },
      { n: 'Lemon', q: 0.5, u: 'whole', a: 'produce' }
    ],
    steps: ['Frozen cooked shrimp thaw under cold running water in four minutes.', 'Everything on a plate, cocktail sauce and lemon over.']
  },

  /* ─────────────────────────── DINNER ────────────────────────── */
  {
    id: 'd-sheetpan-thighs', name: 'Sheet-Pan Chicken Thighs & Vegetables',
    meal: ['dinner'], effort: 'project', minutes: 45, servings: 4, batch: true,
    kcal: 510, protein: 44, carbs: 30, fat: 24, fiber: 6,
    tags: ['batch', 'one-pan', 'high-protein'],
    ing: [
      { n: 'Chicken thighs, boneless skinless', q: 2, u: 'lb', a: 'protein' },
      { n: 'Baby potatoes', q: 1.5, u: 'lb', a: 'produce' },
      { n: 'Broccoli', q: 2, u: 'heads', a: 'produce' },
      { n: 'Bell pepper', q: 2, u: 'large', a: 'produce' },
      { n: 'Red onion', q: 1, u: 'large', a: 'produce' },
      { n: 'Olive oil', q: 3, u: 'tbsp', a: 'pantry' },
      { n: 'Garlic powder & paprika', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Lemon', q: 1, u: 'whole', a: 'produce' }
    ],
    steps: [
      'Oven to 425°F. Halve the potatoes, give them a 15-minute head start with oil and salt.',
      'Everything else onto the pan — two pans if it looks crowded. Crowding steams instead of roasts.',
      '25 more minutes until the chicken hits 165°F.',
      'Lemon squeezed over at the table. Box up three portions right away, while you are still standing there.'
    ],
    why: 'The anchor of your week. Tonight is dinner; the other three portions are Wednesday and Thursday already handled.'
  },
  {
    id: 'd-taco-bowl', name: 'Ground Beef Taco Bowl',
    meal: ['dinner'], effort: 'quick', minutes: 20, servings: 1,
    kcal: 480, protein: 38, carbs: 42, fat: 18, fiber: 9,
    tags: ['quick', 'one-pan', 'high-protein'],
    ing: [
      { n: 'Ground beef, 90% lean', q: 5, u: 'oz', a: 'protein' },
      { n: 'Cooked rice', q: 0.75, u: 'cup', a: 'pantry' },
      { n: 'Black beans, canned', q: 0.5, u: 'cup', a: 'pantry' },
      { n: 'Taco seasoning', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Salsa', q: 3, u: 'tbsp', a: 'pantry' },
      { n: 'Shredded cheddar', q: 0.25, u: 'cup', a: 'dairy' },
      { n: 'Romaine lettuce', q: 1, u: 'cup', a: 'produce' }
    ],
    steps: ['Brown the beef, drain, season.', 'Rice down first, then beef and beans, then the cold stuff on top.']
  },
  {
    id: 'd-salmon-rice', name: 'Salmon with Rice & Broccoli',
    meal: ['dinner'], effort: 'standard', minutes: 30, servings: 1,
    kcal: 510, protein: 42, carbs: 40, fat: 20, fiber: 6,
    tags: ['fish', 'high-protein'],
    ing: [
      { n: 'Salmon fillet', q: 6, u: 'oz', a: 'protein' },
      { n: 'Cooked rice', q: 0.75, u: 'cup', a: 'pantry' },
      { n: 'Broccoli', q: 2, u: 'cups', a: 'produce' },
      { n: 'Olive oil', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Soy sauce', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Lemon', q: 0.5, u: 'whole', a: 'produce' },
      { n: 'Garlic', q: 2, u: 'cloves', a: 'produce' }
    ],
    steps: [
      'Oven to 400°F. Salmon on foil, oil, salt, 12–14 minutes.',
      'Broccoli roasts alongside, or microwave it if you would rather.',
      'Soy sauce, garlic and lemon stirred together and spooned over at the end.'
    ],
    why: 'Salmon twice a week is the part of eating this way with the strongest evidence behind it. Frozen fillets are just as good and half the price.'
  },
  {
    id: 'd-shrimp-stirfry', name: 'Shrimp Stir-Fry with Rice',
    meal: ['dinner'], effort: 'quick', minutes: 18, servings: 1,
    kcal: 445, protein: 36, carbs: 48, fat: 12, fiber: 6,
    tags: ['quick', 'one-pan', 'high-protein'],
    ing: [
      { n: 'Raw shrimp, peeled', q: 7, u: 'oz', a: 'frozen' },
      { n: 'Frozen stir-fry vegetables', q: 2, u: 'cups', a: 'frozen' },
      { n: 'Cooked rice', q: 0.75, u: 'cup', a: 'pantry' },
      { n: 'Soy sauce', q: 2, u: 'tbsp', a: 'pantry' },
      { n: 'Garlic', q: 2, u: 'cloves', a: 'produce' },
      { n: 'Olive oil', q: 2, u: 'tsp', a: 'pantry' }
    ],
    steps: [
      'Frozen shrimp thaw under cold running water in four minutes. That is the only planning this needs.',
      'Vegetables into a hot pan first, 5 minutes, then garlic.',
      'Shrimp last, 3 minutes until just pink. Any longer and they turn to rubber.',
      'Soy sauce in, rice underneath.'
    ],
    why: 'Keep a bag of frozen shrimp permanently. It is the fastest real protein there is.'
  },
  {
    id: 'd-pork-chops', name: 'Pork Chops with Roasted Potatoes',
    meal: ['dinner'], effort: 'standard', minutes: 35, servings: 2,
    kcal: 490, protein: 44, carbs: 34, fat: 20, fiber: 6,
    tags: ['high-protein'],
    ing: [
      { n: 'Pork chops, boneless', q: 12, u: 'oz', a: 'protein' },
      { n: 'Baby potatoes', q: 12, u: 'oz', a: 'produce' },
      { n: 'Green beans', q: 3, u: 'cups', a: 'produce' },
      { n: 'Olive oil', q: 1, u: 'tbsp', a: 'pantry' },
      { n: 'Garlic powder & paprika', q: 2, u: 'tsp', a: 'pantry' }
    ],
    steps: [
      'Potatoes halved, oiled, salted, 425°F for 25 minutes.',
      'Chops in a hot pan, 4 minutes a side, then rest them 5 minutes before cutting.',
      'Green beans steamed while the chops rest.'
    ],
    why: 'Pull pork off the heat at 145°F and let it rest. Overcooked pork is why people think they dislike pork.'
  },
  {
    id: 'd-chili', name: 'Beef & Bean Chili',
    meal: ['dinner', 'lunch'], effort: 'project', minutes: 60, servings: 6, batch: true,
    kcal: 450, protein: 36, carbs: 40, fat: 16, fiber: 12,
    tags: ['batch', 'freezes', 'high-protein', 'high-fiber', 'family'],
    ing: [
      { n: 'Ground beef, 90% lean', q: 2, u: 'lb', a: 'protein' },
      { n: 'Kidney beans, canned', q: 2, u: 'cans', a: 'pantry' },
      { n: 'Black beans, canned', q: 1, u: 'can', a: 'pantry' },
      { n: 'Diced tomatoes, canned', q: 2, u: 'cans', a: 'pantry' },
      { n: 'Tomato paste', q: 2, u: 'tbsp', a: 'pantry' },
      { n: 'Onion', q: 2, u: 'large', a: 'produce' },
      { n: 'Bell pepper', q: 2, u: 'large', a: 'produce' },
      { n: 'Garlic', q: 5, u: 'cloves', a: 'produce' },
      { n: 'Chili powder & cumin', q: 3, u: 'tbsp', a: 'pantry' },
      { n: 'Beef broth', q: 2, u: 'cups', a: 'pantry' }
    ],
    steps: [
      'Brown the beef hard, drain the fat, set it aside.',
      'Onion and pepper in the same pot, 8 minutes. Garlic and spices, 1 minute — this wakes the spices up.',
      'Everything back in with the tomatoes, beans and broth. Simmer 35 minutes, lid off.',
      'Better on day two than day one.'
    ],
    why: 'Twelve grams of fiber a bowl, feeds people who are not dieting without them noticing, and freezes better than anything else here.'
  },
  {
    id: 'd-spaghetti-meatsauce', name: 'Spaghetti with Meat Sauce',
    meal: ['dinner'], effort: 'project', minutes: 45, servings: 5, batch: true,
    kcal: 490, protein: 34, carbs: 52, fat: 16, fiber: 7,
    tags: ['batch', 'freezes', 'family'],
    ing: [
      { n: 'Ground turkey or beef', q: 1.5, u: 'lb', a: 'protein' },
      { n: 'Marinara sauce', q: 2, u: 'jars', a: 'pantry' },
      { n: 'Whole wheat spaghetti', q: 12, u: 'oz', a: 'pantry' },
      { n: 'Onion', q: 1, u: 'large', a: 'produce' },
      { n: 'Zucchini', q: 2, u: 'medium', a: 'produce' },
      { n: 'Garlic', q: 4, u: 'cloves', a: 'produce' },
      { n: 'Parmesan, grated', q: 0.5, u: 'cup', a: 'dairy' },
      { n: 'Olive oil', q: 1, u: 'tbsp', a: 'pantry' }
    ],
    steps: [
      'Brown the meat, drain. Onion and grated zucchini in, 8 minutes — the zucchini disappears completely and stretches the sauce.',
      'Garlic, then the jars of marinara. Simmer 20 minutes.',
      'Pasta cooked separately. Portion the sauce over it rather than mixing everything, so leftovers do not go soggy.'
    ],
    why: 'Grating a zucchini into the sauce adds two servings of vegetables that nobody at the table will detect.'
  },
  {
    id: 'd-roast-chicken', name: 'Roast Chicken & Vegetables',
    meal: ['dinner'], effort: 'project', minutes: 75, servings: 5, batch: true,
    kcal: 495, protein: 46, carbs: 28, fat: 22, fiber: 6,
    tags: ['batch', 'one-pan', 'high-protein'],
    ing: [
      { n: 'Whole chicken', q: 1, u: 'whole', a: 'protein' },
      { n: 'Baby potatoes', q: 1.5, u: 'lb', a: 'produce' },
      { n: 'Carrots', q: 6, u: 'medium', a: 'produce' },
      { n: 'Onion', q: 2, u: 'large', a: 'produce' },
      { n: 'Olive oil', q: 2, u: 'tbsp', a: 'pantry' },
      { n: 'Lemon', q: 1, u: 'whole', a: 'produce' },
      { n: 'Garlic powder & paprika', q: 1, u: 'tbsp', a: 'pantry' }
    ],
    steps: [
      'Oven to 400°F. Vegetables in the bottom of the pan, chicken on top of them.',
      'Oil, salt and seasoning all over the bird. Lemon halves inside it.',
      'About 20 minutes per pound, until the thigh reads 175°F. Rest 15 minutes before carving.',
      'Strip every scrap off the carcass afterward — that meat is three lunches this week.'
    ],
    why: 'One bird is dinner, two chicken salads and a rice bowl. Cheaper per pound than almost anything else and it makes the house smell like someone lives there.'
  },
  {
    id: 'd-burger-salad', name: 'Burger with a Big Salad',
    meal: ['dinner'], effort: 'quick', minutes: 18, servings: 1,
    kcal: 500, protein: 40, carbs: 26, fat: 26, fiber: 5,
    tags: ['quick', 'high-protein'],
    ing: [
      { n: 'Ground beef, 90% lean', q: 6, u: 'oz', a: 'protein' },
      { n: 'Hamburger bun, whole wheat', q: 1, u: 'whole', a: 'bakery' },
      { n: 'Cheddar cheese', q: 1, u: 'slice', a: 'dairy' },
      { n: 'Mixed salad greens', q: 3, u: 'cups', a: 'produce' },
      { n: 'Tomato', q: 3, u: 'slices', a: 'produce' },
      { n: 'Red onion', q: 0.25, u: 'small', a: 'produce' },
      { n: 'Olive oil', q: 2, u: 'tsp', a: 'pantry' },
      { n: 'Red wine vinegar', q: 1, u: 'tbsp', a: 'pantry' }
    ],
    steps: ['Season the patty on the outside only, cook it hard on both sides.', 'On the bun with cheese, and a genuinely big dressed salad instead of fries.'],
    why: 'A burger is not off the plan. A burger with fries and a soda is. Change the side, keep the burger.'
  },
  {
    id: 'd-chicken-stirfry', name: 'Chicken & Vegetable Stir-Fry',
    meal: ['dinner'], effort: 'quick', minutes: 20, servings: 1,
    kcal: 455, protein: 42, carbs: 40, fat: 14, fiber: 6,
    tags: ['quick', 'one-pan', 'high-protein'],
    ing: [
      { n: 'Chicken breast', q: 6, u: 'oz', a: 'protein' },
      { n: 'Frozen stir-fry vegetables', q: 2, u: 'cups', a: 'frozen' },
      { n: 'Cooked rice', q: 0.75, u: 'cup', a: 'pantry' },
      { n: 'Soy sauce', q: 2, u: 'tbsp', a: 'pantry' },
      { n: 'Garlic', q: 2, u: 'cloves', a: 'produce' },
      { n: 'Olive oil', q: 2, u: 'tsp', a: 'pantry' },
      { n: 'Honey', q: 1, u: 'tsp', a: 'pantry' }
    ],
    steps: ['Chicken in strips, hot pan, 5 minutes, take it out.', 'Vegetables and garlic in, 5 minutes.', 'Chicken back in with soy sauce and honey. Rice underneath.']
  },
  {
    id: 'd-tuna-pasta', name: 'Tuna & Tomato Pasta',
    meal: ['dinner'], effort: 'quick', minutes: 20, servings: 1,
    kcal: 470, protein: 34, carbs: 52, fat: 14, fiber: 7,
    tags: ['quick', 'pantry-only', 'one-pan'],
    ing: [
      { n: 'Canned tuna', q: 1, u: 'can', a: 'pantry' },
      { n: 'Whole wheat spaghetti', q: 2.5, u: 'oz', a: 'pantry' },
      { n: 'Marinara sauce', q: 0.75, u: 'cup', a: 'pantry' },
      { n: 'Baby spinach', q: 2, u: 'cups', a: 'produce' },
      { n: 'Garlic', q: 2, u: 'cloves', a: 'produce' },
      { n: 'Olive oil', q: 2, u: 'tsp', a: 'pantry' },
      { n: 'Parmesan, grated', q: 1, u: 'tbsp', a: 'dairy' }
    ],
    steps: ['Pasta on. Garlic in oil in another pan, then the marinara.', 'Spinach wilted in, tuna folded through at the very end off the heat.'],
    why: 'Every part of this keeps in a cupboard for a year. It is the answer on the night the refrigerator is empty.'
  },
  {
    id: 'd-rotisserie-plate', name: 'Rotisserie Chicken Plate',
    meal: ['dinner', 'lunch'], effort: 'none', minutes: 7, servings: 1,
    kcal: 460, protein: 44, carbs: 30, fat: 18, fiber: 6,
    tags: ['no-cook', 'emergency', 'bought', 'high-protein'],
    ing: [
      { n: 'Rotisserie chicken', q: 6, u: 'oz', a: 'protein' },
      { n: 'Microwave rice pouch', q: 0.75, u: 'pouch', a: 'pantry' },
      { n: 'Bagged salad kit', q: 2, u: 'cups', a: 'produce' },
      { n: 'Cherry tomatoes', q: 1, u: 'cup', a: 'produce' }
    ],
    steps: ['Pull the meat off with your hands. Skin off if you can be bothered, on if you cannot.', 'Rice 90 seconds, salad out of the bag. Plate it and sit down.'],
    why: 'Grabbing a rotisserie chicken on the way home is not cheating. It is a dinner that actually happens, plus two lunches.'
  },
  {
    id: 'd-deli-plate', name: 'Cold Plate',
    meal: ['dinner', 'lunch'], effort: 'none', minutes: 6, servings: 1,
    kcal: 420, protein: 36, carbs: 24, fat: 20, fiber: 5,
    tags: ['no-cook', 'emergency', 'high-protein'],
    ing: [
      { n: 'Sliced turkey breast, deli', q: 5, u: 'oz', a: 'protein' },
      { n: 'Cheddar cheese', q: 1, u: 'oz', a: 'dairy' },
      { n: 'Whole wheat crackers', q: 10, u: 'whole', a: 'pantry' },
      { n: 'Baby carrots', q: 1, u: 'cup', a: 'produce' },
      { n: 'Cucumber', q: 1, u: 'cup', a: 'produce' },
      { n: 'Hummus', q: 3, u: 'tbsp', a: 'dairy' },
      { n: 'Apple', q: 1, u: 'medium', a: 'produce' }
    ],
    steps: ['Open six things, put them on a plate.', 'Eat standing up if that is the kind of day it was.'],
    why: 'This exists for the fourteen-hour day. It is not a great dinner and it is not supposed to be — it is the thing that stops the delivery app winning.'
  },
  {
    id: 'd-chicken-over-salad', name: 'Grilled Chicken over Salad',
    meal: ['dinner'], effort: 'quick', minutes: 18, servings: 1,
    kcal: 420, protein: 44, carbs: 16, fat: 20, fiber: 5,
    tags: ['quick', 'high-protein', 'low-carb'],
    ing: [
      { n: 'Chicken breast', q: 7, u: 'oz', a: 'protein' },
      { n: 'Mixed salad greens', q: 4, u: 'cups', a: 'produce' },
      { n: 'Cucumber', q: 1, u: 'cup', a: 'produce' },
      { n: 'Cherry tomatoes', q: 1, u: 'cup', a: 'produce' },
      { n: 'Avocado', q: 0.33, u: 'medium', a: 'produce' },
      { n: 'Olive oil', q: 2, u: 'tsp', a: 'pantry' },
      { n: 'Red wine vinegar', q: 1, u: 'tbsp', a: 'pantry' }
    ],
    steps: ['Pound the chicken to an even thickness so it cooks evenly — 5 minutes a side.', 'Rest it 3 minutes, slice across the grain, lay it over the dressed salad.']
  },
  {
    id: 'd-veggie-omelet', name: 'Veggie Omelet & Toast',
    meal: ['dinner', 'breakfast'], effort: 'quick', minutes: 14, servings: 1,
    kcal: 420, protein: 30, carbs: 26, fat: 22, fiber: 5,
    tags: ['quick', 'vegetarian', 'one-pan'],
    ing: [
      { n: 'Eggs', q: 3, u: 'large', a: 'dairy' },
      { n: 'Shredded cheddar', q: 0.25, u: 'cup', a: 'dairy' },
      { n: 'Bell pepper', q: 0.5, u: 'medium', a: 'produce' },
      { n: 'Baby spinach', q: 2, u: 'cups', a: 'produce' },
      { n: 'Whole wheat bread', q: 1, u: 'slice', a: 'bakery' },
      { n: 'Olive oil', q: 2, u: 'tsp', a: 'pantry' }
    ],
    steps: ['Peppers first, then spinach to wilt.', 'Eggs over, lid on, 4 minutes. Cheese, fold, done.'],
    why: 'Eggs at night are not a failure of imagination. They are a Tuesday.'
  },
  {
    id: 'd-sushi-dinner', name: 'Sushi Night',
    meal: ['dinner'], effort: 'none', minutes: 5, servings: 1,
    kcal: 410, protein: 28, carbs: 56, fat: 8, fiber: 4,
    tags: ['no-cook', 'bought', 'emergency'],
    ing: [
      { n: 'Sushi or poke bowl, store-bought', q: 1, u: 'container', a: 'protein' },
      { n: 'Edamame', q: 0.75, u: 'cup', a: 'frozen' },
      { n: 'Miso soup packet', q: 1, u: 'whole', a: 'pantry' }
    ],
    steps: [
      'Salmon, tuna, shrimp or a plain poke bowl. Avoid tempura, crunchy and spicy mayo rolls.',
      'Edamame and miso alongside make it a proper dinner rather than a snack.'
    ],
    why: 'You mentioned you like it, so it is in the rotation on purpose. Lean fish and portioned rice — it fits the numbers without any effort from you at all.'
  },
  {
    id: 'd-pork-loin-veg', name: 'Pork Loin with Roasted Vegetables',
    meal: ['dinner'], effort: 'project', minutes: 60, servings: 4, batch: true,
    kcal: 480, protein: 44, carbs: 28, fat: 22, fiber: 6,
    tags: ['batch', 'one-pan', 'high-protein'],
    ing: [
      { n: 'Pork loin roast', q: 2, u: 'lb', a: 'protein' },
      { n: 'Baby potatoes', q: 1.5, u: 'lb', a: 'produce' },
      { n: 'Carrots', q: 5, u: 'medium', a: 'produce' },
      { n: 'Onion', q: 2, u: 'large', a: 'produce' },
      { n: 'Olive oil', q: 2, u: 'tbsp', a: 'pantry' },
      { n: 'Garlic powder & paprika', q: 1, u: 'tbsp', a: 'pantry' }
    ],
    steps: [
      'Oven to 400°F. Sear the loin on all sides in a hot pan first — 6 minutes total, and worth it.',
      'Onto a sheet pan on the vegetables, roast 40 minutes until it reads 145°F.',
      'Rest 10 minutes before slicing, or all the juice runs out onto the board.'
    ],
    why: 'Pork loin is one of the cheapest lean proteins in the store and slices cold into sandwiches all week.'
  },

  /* ─────────────────────────── SNACKS ────────────────────────── */
  {
    id: 's-yogurt', name: 'Greek Yogurt',
    meal: ['snack'], effort: 'none', minutes: 2, servings: 1,
    kcal: 150, protein: 16, carbs: 14, fat: 3, fiber: 0,
    tags: ['no-cook', 'high-protein'],
    ing: [
      { n: 'Plain Greek yogurt', q: 0.75, u: 'cup', a: 'dairy' },
      { n: 'Honey', q: 1, u: 'tsp', a: 'pantry' }
    ],
    steps: ['That is the whole recipe.']
  },
  {
    id: 's-almonds', name: 'Almonds',
    meal: ['snack'], effort: 'none', minutes: 1, servings: 1,
    kcal: 175, protein: 6, carbs: 6, fat: 14, fiber: 4,
    tags: ['no-cook', 'portable', 'desk-drawer'],
    ing: [{ n: 'Almonds', q: 24, u: 'whole', a: 'pantry' }],
    steps: ['Count them. Twenty-four, not a handful — a handful is usually sixty.'],
    why: 'Keep a measured bag in your desk and your truck. This is the hour-nine snack that protects the drive home.'
  },
  {
    id: 's-apple-pb', name: 'Apple & Peanut Butter',
    meal: ['snack'], effort: 'none', minutes: 2, servings: 1,
    kcal: 195, protein: 7, carbs: 24, fat: 8, fiber: 5,
    tags: ['no-cook', 'portable'],
    ing: [
      { n: 'Apple', q: 1, u: 'medium', a: 'produce' },
      { n: 'Peanut butter', q: 1, u: 'tbsp', a: 'pantry' }
    ],
    steps: ['Slice the apple. One level tablespoon — level, not heaped.']
  },
  {
    id: 's-string-cheese', name: 'String Cheese & Grapes',
    meal: ['snack'], effort: 'none', minutes: 2, servings: 1,
    kcal: 160, protein: 9, carbs: 18, fat: 6, fiber: 1,
    tags: ['no-cook', 'portable', 'desk-drawer'],
    ing: [
      { n: 'String cheese', q: 1, u: 'stick', a: 'dairy' },
      { n: 'Grapes', q: 1, u: 'cup', a: 'produce' }
    ],
    steps: ['Nothing to explain.']
  },
  {
    id: 's-boiled-eggs', name: 'Hard-Boiled Eggs',
    meal: ['snack'], effort: 'none', minutes: 2, servings: 1,
    kcal: 145, protein: 13, carbs: 1, fat: 10, fiber: 0,
    tags: ['no-cook', 'high-protein', 'prep-ahead'],
    ing: [
      { n: 'Hard-boiled eggs', q: 2, u: 'large', a: 'dairy' },
      { n: 'Salt & pepper', q: 1, u: 'pinch', a: 'pantry' }
    ],
    steps: ['Boil a dozen on Sunday. They keep a week in the shell.']
  },
  {
    id: 's-hummus-carrots', name: 'Hummus & Baby Carrots',
    meal: ['snack'], effort: 'none', minutes: 3, servings: 1,
    kcal: 170, protein: 6, carbs: 18, fat: 8, fiber: 6,
    tags: ['no-cook', 'vegetarian'],
    ing: [
      { n: 'Hummus', q: 3, u: 'tbsp', a: 'dairy' },
      { n: 'Baby carrots', q: 1.5, u: 'cups', a: 'produce' }
    ],
    steps: ['Buy the baby carrots already cut. Whole carrots you have to peel do not get eaten.']
  },
  {
    id: 's-cottage-snack', name: 'Cottage Cheese & Tomatoes',
    meal: ['snack'], effort: 'none', minutes: 3, servings: 1,
    kcal: 170, protein: 20, carbs: 14, fat: 4, fiber: 2,
    tags: ['no-cook', 'high-protein'],
    ing: [
      { n: 'Cottage cheese, low-fat', q: 0.75, u: 'cup', a: 'dairy' },
      { n: 'Cherry tomatoes', q: 1, u: 'cup', a: 'produce' },
      { n: 'Olive oil', q: 1, u: 'tsp', a: 'pantry' }
    ],
    steps: ['Tomatoes over the cottage cheese, oil, a lot of black pepper.'],
    why: 'Twenty grams of protein for 170 calories. Reach for this one on the days the app says you are behind.'
  },
  {
    id: 's-jerky', name: 'Beef Jerky',
    meal: ['snack'], effort: 'none', minutes: 1, servings: 1,
    kcal: 150, protein: 22, carbs: 8, fat: 3, fiber: 0,
    tags: ['no-cook', 'portable', 'desk-drawer', 'high-protein'],
    ing: [{ n: 'Beef jerky', q: 2, u: 'oz', a: 'protein' }],
    steps: ['Check the label — some brands carry a startling amount of sugar.'],
    why: 'Lives in a glovebox indefinitely. The best thing you can have on you when a meeting runs three hours long.'
  },
  {
    id: 's-popcorn', name: 'Popcorn',
    meal: ['snack'], effort: 'none', minutes: 3, servings: 1,
    kcal: 150, protein: 4, carbs: 22, fat: 5, fiber: 4,
    tags: ['no-cook', 'evening', 'craving'],
    ing: [{ n: 'Microwave popcorn, light', q: 1, u: 'bag', a: 'pantry' }],
    steps: ['One bag is usually two servings. Put half in a bowl and put the bag away.'],
    why: 'Three cups of it is a genuinely large amount of food for very few calories. Good for the evening where you want to be chewing something.'
  },
  {
    id: 's-chocolate', name: 'Dark Chocolate',
    meal: ['snack'], effort: 'none', minutes: 2, servings: 1,
    kcal: 110, protein: 2, carbs: 10, fat: 7, fiber: 2,
    tags: ['no-cook', 'evening', 'craving'],
    ing: [{ n: 'Dark chocolate, 70%', q: 2, u: 'squares', a: 'pantry' }],
    steps: ['Two squares, eaten slowly, with coffee or tea.', 'Then the kitchen is closed for the night.'],
    why: 'A planned 110-calorie treat at nine o\'clock is what prevents the unplanned 600-calorie one at ten. This is a tool, not a cheat.'
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
