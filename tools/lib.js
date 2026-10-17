// Fonctions communes aux outils (lecture de database.js / recette.js, noms, ingrédients).
const fs = require("fs"), path = require("path"), vm = require("vm");

// Exécute un fichier JS du site dans un bac à sable (sans navigateur) et récupère des variables.
function runScript(file, exportExpr) {
  const code = fs.readFileSync(file, "utf8");
  const el = () => ({addEventListener() {}, classList: {toggle() {}, add() {}, remove() {}}, style: {}, appendChild() {}});
  const sandbox = {
    console, URLSearchParams, setTimeout() {}, navigator: {}, localStorage: {getItem: () => null, setItem() {}},
    window: {location: {search: "", href: ""}},
    document: {addEventListener() {}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: el},
  };
  vm.createContext(sandbox);
  vm.runInContext(code + "\n;globalThis.__out=" + exportExpr + ";", sandbox, {filename: file});
  return sandbox.__out;
}

function loadSite(root) {
  const db = runScript(path.join(root, "assets/js/database.js"), "{allRecettes,categories}");
  const st = runScript(path.join(root, "assets/js/recette.js"), "{recipePreparationSteps,defaultPreparationSteps}");
  return {recettes: db.allRecettes, categories: db.categories, steps: st.recipePreparationSteps, defaultSteps: st.defaultPreparationSteps};
}

const slug = (s) => s.replace(/œ/gi, "oe").replace(/æ/gi, "ae").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p, base) : [path.relative(base, p).split(path.sep).join("/")];
  });
}

// "chocolat noir 200g" -> {nom:"chocolat noir", qte:200, unite:"g"} ; "œufs 3" ; "saumon 2 filets" ; "pastèque 1/4"
const UNITS = {g: "g", kg: "kg", ml: "ml", cl: "cl", l: "l", cs: "c. à soupe", cc: "c. à café"};
const toNum = (s) => (s.includes("/") ? s.split("/")[0] / s.split("/")[1] : parseFloat(s.replace(",", ".")));
function parseIngredient(str) {
  const s = str.trim();
  let m = s.match(/^(.+?)\s+(\d+(?:[.,]\d+)?(?:\/\d+)?)\s*(kg|g|ml|cl|l|cs|cc)$/i);
  if (m) return {nom: m[1], qte: toNum(m[2]), unite: UNITS[m[3].toLowerCase()], ok: true};
  m = s.match(/^(.+?)\s+(\d+(?:[.,]\d+)?(?:\/\d+)?)\s+([a-zàâçéèêëîïôûùü'’ ]+)$/i);
  if (m) return {nom: m[1], qte: toNum(m[2]), unite: m[3].trim(), ok: true};
  m = s.match(/^(.+?)\s+(\d+(?:[.,]\d+)?(?:\/\d+)?)$/);
  if (m) return {nom: m[1], qte: toNum(m[2]), unite: "", ok: true};
  return {nom: s, qte: null, unite: "", ok: !/\d/.test(s)};
}

// Ressemblance entre deux textes (0 à 1) pour repérer les recettes quasi identiques.
const words = (t) => new Set(slug(t).split("-").filter((w) => w.length > 3));
function similarity(a, b) {
  const A = words(a), B = words(b);
  let inter = 0; A.forEach((w) => B.has(w) && inter++);
  return inter / (A.size + B.size - inter || 1);
}

const MEAT = /(viande|poulet|boeuf|agneau|veau|porc|saumon|poisson|thon|crevette|lardon|bacon|jambon|steak|canard|gelatine)/;
function meatWords(ingredients) {
  const t = slug(ingredients.join(" ")).replace(/-/g, " ");
  return (t.match(new RegExp(MEAT, "g")) || []);
}
const hasQuantity = (t) => /\d+(?:[.,]\d+)?\s?(?:g|kg|ml|cl|l|cuill|c\. |cm)\b|\d+\s?(?:œufs?|oeufs?|jaunes?|blancs?|citrons?|oignons?|carottes?)/i.test(t);

// Marque les quantités qui doivent suivre le nombre de portions : "Mélangez 500g de sucre" -> "Mélangez {500}g de sucre".
// Les durées, températures et tailles (minutes, °C, cm) ne sont jamais marquées.
const NUM = "(?<![\\w/.,])(\\d+(?:[.,]\\d+)?(?:/\\d+)?)";
const UNIT_A = "kg|g|ml|cl|l|litres?|cuillères?";
const NOUNS = "œufs?|oeufs?|jaunes?|blancs?|citrons?|oranges?|oignons?|carottes?|tomates?|poivrons?|gousses?|pommes|bananes?|avocats?|courgettes?|aubergines?|poulets?|biscuits?|muffins?|tranches?|feuilles?|pains?|tortillas?|poissons?|filets?|boules?|steaks?|verrines?|ramequins?|verres?|bols?|brochettes?|croquettes?|boulettes?";
function marquerQuantites(texte) {
  const friture = /friteuse|friture|frire|frit\b/i.test(texte);
  let t = texte.replace(new RegExp(NUM + "(\\s?)(" + UNIT_A + ")\\b", "gi"), (m, n, sp, u) =>
    friture && /^(l|litres?)$/i.test(u) ? m : "{" + n + "}" + sp + u);
  t = t.replace(new RegExp(NUM + "(\\s+)(" + NOUNS + ")\\b", "gi"), (m, n, sp, w) => "{" + n + "}" + sp + w);
  return t;
}

module.exports = {loadSite, slug, walk, parseIngredient, similarity, meatWords, hasQuantity, marquerQuantites};
