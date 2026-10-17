#!/usr/bin/env node
// Convertit toutes les images en WebP (1200 px et 600 px) dans img-v2/ : node tools/optimize-images.js [dossier_du_site]
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const sharp = require("sharp");
const {slug, walk} = require("./lib");

(async () => {
  const root = path.resolve(process.argv[2] || ".");
  const outDir = path.join(root, "img-v2");
  fs.mkdirSync(outDir, {recursive: true});
  const files = walk(path.join(root, "images")).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  const map = {}, seen = {}, taken = new Set();
  let before = 0, after = 0;
  for (const f of files) {
    const abs = path.join(root, "images", f), buf = fs.readFileSync(abs);
    before += buf.length;
    const hash = crypto.createHash("md5").update(buf).digest("hex");
    let name = seen[hash];
    if (!name) {
      name = slug(path.basename(f, path.extname(f)));
      for (let n = 2; taken.has(name); n++) name = slug(path.basename(f, path.extname(f))) + "-" + n;
      taken.add(name); seen[hash] = name;
      for (const w of [1200, 600]) {
        const dest = path.join(outDir, `${name}-${w}.webp`);
        await sharp(buf).rotate().resize({width: w, withoutEnlargement: true}).webp({quality: 78}).toFile(dest);
        after += fs.statSync(dest).size;
      }
    }
    map[("images/" + f).toLowerCase()] = name;   // clé en minuscules : règle aussi les problèmes de casse
  }
  fs.mkdirSync(path.join(root, "data"), {recursive: true});
  fs.writeFileSync(path.join(root, "data/image-map.json"), JSON.stringify(map, null, 2), "utf8");
  console.log(`${files.length} images lues, ${Object.keys(seen).length} images uniques écrites dans img-v2/`);
  console.log(`Avant : ${(before / 1048576).toFixed(1)} Mo (originaux)   Après : ${(after / 1048576).toFixed(1)} Mo (2 tailles par image)`);
})();
