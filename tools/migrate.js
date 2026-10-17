#!/usr/bin/env node
// Construit data/recettes.json (propre) à partir de database.js et recette.js : node tools/migrate.js [dossier_du_site]
const fs = require("fs"), path = require("path");
const {loadSite, slug, parseIngredient, similarity, meatWords, hasQuantity, marquerQuantites} = require("./lib");

const root = path.resolve(process.argv[2] || ".");
const {recettes, steps, defaultSteps} = loadSite(root);
const mapFile = path.join(root, "data/image-map.json");
const imageMap = fs.existsSync(mapFile) ? JSON.parse(fs.readFileSync(mapFile, "utf8")) : {};

// Catégorie principale. Les anciennes catégories « rapide » et « végétarien » deviennent des filtres calculés,
// donc ces recettes ont besoin d'une vraie catégorie. SUGGESTIONS À VÉRIFIER :
const MAIN = {dessert: "desserts", plat: "plats", snack: "snacks", "petit-dejeuner": "petit-dejeuner", africain: "africain", boisson: "boissons"};
const CHOIX = {11: "africain", 46: "plats", 47: "plats", 48: "plats", 49: "snacks", 50: "snacks", 51: "plats", 52: "plats", 53: "plats", 54: "snacks", 55: "plats", 57: "plats", 58: "plats", 59: "snacks", 60: "plats"};

// Recettes à regrouper : { id_à_supprimer: id_à_garder }. Vide par défaut. Exemple : {35: 29, 45: 39}
const FUSIONS = {};

const rapport = [], out = [], bySlug = {};
const note = (s) => rapport.push(s);
const aClasser = [], ingVerif = [], sansImage = [], gelatine = [];

recettes.forEach((r) => {
  const s = slug(r.titre);
  if (FUSIONS[r.id]) { note(`Fusion demandée : #${r.id} "${r.titre}" supprimée au profit de #${FUSIONS[r.id]}`); return; }
  const categorie = CHOIX[r.id] || MAIN[r.categorie] || r.categorie;
  if (CHOIX[r.id]) aClasser.push(`#${r.id} ${r.titre} -> ${categorie} (ancienne catégorie : ${r.categorie})`);
  const nonVeg = meatWords(r.ingredients);
  const veg = nonVeg.length === 0;
  if (nonVeg.length === 1 && nonVeg[0] === "gelatine") gelatine.push(`#${r.id} ${r.titre}`);
  if (bySlug[s]) {                       // doublon : on fusionne dans la première
    const keep = bySlug[s];
    keep.vegetarien = keep.vegetarien || r.categorie === "vegetarien";
    note(`Fusion : #${r.id} "${r.titre}" regroupée avec #${keep.id_ancien}`);
    return;
  }
  const ingredients = r.ingredients.map((i) => { const p = parseIngredient(i); if (!p.ok) ingVerif.push(`#${r.id} "${i}"`); return {nom: p.nom, qte: p.qte, unite: p.unite}; });
  const image = imageMap[String(r.image).toLowerCase()] || null;
  if (!image) sansImage.push(`#${r.id} ${r.titre}: ${r.image}`);
  const rec = {
    id: r.id, id_ancien: r.id, slug: s, titre: r.titre, categorie, description: r.description,
    temps: parseInt(r.temps, 10), niveau: r.difficulte, portions: r.portions, image,
    vegetarien: r.categorie === "vegetarien" || veg,
    ingredients, etapes: (steps[r.id] || defaultSteps[r.categorie] || []).map(marquerQuantites),
  };
  bySlug[s] = rec; out.push(rec);
});
out.forEach((r) => delete r.id_ancien);

fs.mkdirSync(path.join(root, "data"), {recursive: true});
fs.writeFileSync(path.join(root, "data/recettes.json"), JSON.stringify(out, null, 2), "utf8");

const md = ["# Rapport de migration", "", `${recettes.length} recettes lues, ${out.length} recettes écrites dans data/recettes.json.`, ""];
const sec = (t, l, c = "") => { md.push("## " + t, c, ""); md.push(...(l.length ? l.map((x) => "- " + x) : ["- rien à signaler"]), ""); };
sec("Fusions de doublons", rapport);
sec("Catégories choisies par moi (à vérifier)", aClasser, "Les anciennes catégories Rapide et Végétarien deviennent des filtres. Modifie CHOIX dans tools/migrate.js si besoin.");
sec("Végétarien : gélatine animale (à trancher)", gelatine, "Détecté automatiquement d'après les ingrédients. Vérifie aussi les autres recettes marquées végétariennes.");
sec("Ingrédients dont la quantité n'a pas été reconnue", ingVerif);
sec("Images introuvables", sansImage, "Lance d'abord node tools/optimize-images.js.");
const nbMarques = out.reduce((n, r) => n + r.etapes.reduce((m, e) => m + (e.match(/\{/g) || []).length, 0), 0);
md.push("## Quantités dans les étapes", "Les quantités qui doivent suivre les portions sont entourées d'accolades, par exemple {500}g. Le site les recalculera.", `- ${nbMarques} quantités marquées. Vérifie quelques recettes dans data/recettes.json (cherche les accolades).`, "");
const resteFixe = out.filter((r) => r.etapes.some((e) => hasQuantity(e.replace(/\{[^}]*\}/g, ""))));
sec("Étapes avec une quantité non marquée (à vérifier)", resteFixe.map((r) => `#${r.id} ${r.titre}`));
const proches = [];
for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) { const s = similarity(out[i].etapes.join(" "), out[j].etapes.join(" ")); if (s > 0.55) proches.push(`${out[i].titre} / ${out[j].titre} (${Math.round(s * 100)} %)`); }
sec("Recettes presque identiques (à fusionner ou différencier)", proches);
fs.writeFileSync(path.join(root, "data/rapport-migration.md"), md.join("\n"), "utf8");
console.log(`OK : ${out.length} recettes écrites dans data/recettes.json`);
console.log("Lis data/rapport-migration.md pour les points à vérifier.");
