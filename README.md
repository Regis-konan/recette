# Outils de nettoyage – Recettes Faciles

Ces outils ne modifient ni ne suppriment rien de ton site actuel. Ils lisent `assets/js/database.js`, `assets/js/recette.js` et le dossier `images/`, et écrivent leurs résultats dans de nouveaux fichiers : `audit-rapport.txt`, `img-v2/` et `data/`.

## Installation (dans D:\app_recette, branche refonte-v2)
1. Copie le dossier `tools` et le fichier `package.json` à la racine du site (si tu as déjà un package.json, garde le tien).
2. Dans PowerShell : `npm install` (installe `sharp`, l'outil de conversion d'images). Node.js doit être installé.
3. Ajoute un fichier `.gitignore` contenant la ligne `node_modules`.

## Utilisation, dans cet ordre
```
node tools/audit.js .             # état des lieux -> audit-rapport.txt
node tools/optimize-images.js .   # images WebP 1200 px + 600 px -> img-v2/ et data/image-map.json
node tools/migrate.js .           # données propres -> data/recettes.json et data/rapport-migration.md
```
Lis les rapports : ils listent ce qu'il faut décider ou corriger à la main (catégories choisies, végétarien, ingrédients non reconnus, étapes avec quantités, recettes presque identiques).

## Ce que fait la migration
- Garde : titre, description, temps (en nombre), niveau, portions, image, ingrédients (nom, quantité, unité), étapes.
- Supprime : notes et avis (`rating`, `reviews`), `favori`, icônes et couleurs de catégories.
- Fusionne les doublons de titre (ex. la ratatouille en double) et corrige les problèmes de casse des images.
- « Rapide » et « Végétarien » ne sont plus des catégories : le temps ≤ 30 min et le champ `vegetarien` servent de filtres.
