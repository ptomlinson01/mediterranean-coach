/* Food database tests.  Run with: node test/foods.test.mjs */
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const base = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..', 'js') + '/').href;
const F = await import(base + 'foods.js');

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS  ' : 'FAIL  ') + msg); if (!cond) fails++; };

ok(F.FOODS.length >= 140, `the table has ${F.FOODS.length} foods`);
ok(F.FOODS.every(f => f.n && f.u && f.k >= 0 && f.p >= 0 && f.t), 'every food has a name, a unit, calories, protein and tags');
ok(new Set(F.FOODS.map(f => f.n.toLowerCase())).size === F.FOODS.length, 'no duplicate names');
ok(!F.FOODS.some(f => /courgette|tinned|rocket|mince|aubergine/i.test(f.n)), 'American names only');

ok(F.searchFoods('banana')[0].n === 'Banana, medium', 'a plain word finds the obvious food first');
ok(F.searchFoods('ipa')[0].n === 'Beer, IPA', 'a short word still matches');
ok(F.searchFoods('salmon roll')[0].n.startsWith('Salmon roll'), 'two words both have to land');
ok(F.searchFoods('chicken').length >= 8, 'a broad word returns a full page');
ok(F.searchFoods('wine').every(f => /wine/i.test(f.n)), 'results all match');
ok(F.searchFoods('').length === 0 && F.searchFoods('zzzz').length === 0, 'empty and nonsense queries return nothing');
ok(F.searchFoods('alcohol').length >= 5, 'tags are searchable (alcohol)');

console.log(fails ? `\n${fails} check(s) failed.` : '\nAll checks passed.');
process.exit(fails ? 1 : 0);
