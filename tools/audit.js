#!/usr/bin/env node
// Audit du site, sans rien modifier : node tools/audit.js [dossier_du_site]
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const {loadSite, slug, walk, parseIngredient, similarity, hasQuantity} = require("./lib");

const root = path.resolve(process.argv[2] || ".");
const {recettes, steps} = loadSite(root);
const out = [];
const log = (s = "") => { out.push(s); console.log(s); };
const h = (t) => { log(); log("== " + t + " =="); };

// 1. Images
const files = walk(path.join(root, "images")).map((f) => "images/" + f);
const exact = new Set(files), lower = new Map(files.map((f) => [f.toLowerCase(), f]));
const used = new Set();
const missing = [], wrongCase = [];
recettes.forEach((r) => {
  if (exact.has(r.image)) used.add(r.image);
  else if (lower.has(r.image.toLowerCase())) { wrongCase.push(`#${r.id} ${r.titre}: le code dit "${r.image}", le fichier est "${lower.get(r.image.toLowerCase())}"`); used.add(lower.get(r.image.toLowerCase())); }
  else missing.push(`#${r.id} ${r.titre}: ${r.image}`);
});
const total = files.reduce((n, f) => n + fs.statSync(path.join(root, f)).size, 0);
h("IMAGES");
log(`${files.length} fichiers, ${(total / 1048576).toFixed(1)} Mo au total (${(total / files.length / 1024).toFixed(0)} Ko en moyenne)`);
log(`Casse différente (cassera sur GitHub Pages) : ${wrongCase.length}`); wrongCase.forEach((x) => log("  - " + x));
log(`Introuvables : ${missing.length}`); missing.forEach((x) => log("  - " + x));
const unused = files.filter((f) => !used.has(f));
log(`Fichiers non utilisés par database.js : ${unused.length}`); unused.forEach((x) => log("  - " + x));
const byHash = {};
files.forEach((f) => { const k = crypto.createHash("md5").update(fs.readFileSync(path.join(root, f))).digest("hex"); (byHash[k] = byHash[k] || []).push(f); });
const dups = Object.values(byHash).filter((g) => g.length > 1);
log(`Images identiques en double : ${dups.length}`); dups.forEach((g) => log("  - " + g.join("  =  ")));

// 2. Recettes en double ou quasi identiques
h("RECETTES");
const bySlug = {};
recettes.forEach((r) => (bySlug[slug(r.titre)] = bySlug[slug(r.titre)] || []).push(r));
Object.values(bySlug).filter((g) => g.length > 1).forEach((g) => log(`Même titre : "${g[0].titre}" (ids ${g.map((r) => r.id).join(", ")})`));
for (let i = 0; i < recettes.length; i++) for (let j = i + 1; j < recettes.length; j++) {
  const a = recettes[i], b = recettes[j];
  if (slug(a.titre) === slug(b.titre)) continue;
  const s = similarity((steps[a.id] || []).join(" "), (steps[b.id] || []).join(" "));
  if (s > 0.55) log(`Étapes très proches (${Math.round(s * 100)} %) : #${a.id} ${a.titre}  /  #${b.id} ${b.titre}`);
}
const noSteps = recettes.filter((r) => !steps[r.id]);
log(`Sans étapes spécifiques : ${noSteps.length}`);

// 3. Ingrédients et étapes
h("INGRÉDIENTS ET ÉTAPES");
let bad = 0;
recettes.forEach((r) => r.ingredients.forEach((i) => { const p = parseIngredient(i); if (!p.ok) { bad++; log(`  ingrédient à vérifier : #${r.id} "${i}"`); } }));
log(`Ingrédients avec chiffre non reconnu : ${bad}`);
const withQty = recettes.filter((r) => (steps[r.id] || []).some(hasQuantity));
log(`Recettes dont les étapes contiennent des quantités fixes : ${withQty.length} sur ${recettes.length}`);
log("  (elles ne suivront pas le changement de portions)");

// 4. Champs inventés
h("CHAMPS À SUPPRIMER");
log(`rating / reviews (notes et avis) : présents sur ${recettes.filter((r) => r.rating).length} recettes. Aucun système d'avis ne les alimente.`);
log(`favori : présent sur ${recettes.filter((r) => "favori" in r).length} recettes, alors que les vrais favoris sont dans le navigateur.`);

fs.writeFileSync(path.join(root, "audit-rapport.txt"), out.join("\n"), "utf8");
log(); log("Rapport enregistré : audit-rapport.txt");
