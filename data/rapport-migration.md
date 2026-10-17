# Rapport de migration

83 recettes lues, 82 recettes écrites dans data/recettes.json.

## Fusions de doublons


- Fusion : #56 "Ratatouille Provençale" regroupée avec #13

## Catégories choisies par moi (à vérifier)
Les anciennes catégories Rapide et Végétarien deviennent des filtres. Modifie CHOIX dans tools/migrate.js si besoin.

- #11 Poulet Yassa Sénégalais -> africain (ancienne catégorie : plat)
- #46 Salade César -> plats (ancienne catégorie : rapide)
- #47 Omelette aux Légumes -> plats (ancienne catégorie : rapide)
- #48 Pâtes à l'Ail et à l'Huile -> plats (ancienne catégorie : rapide)
- #49 Sandwich Club -> snacks (ancienne catégorie : rapide)
- #50 Wrap au Poulet -> snacks (ancienne catégorie : rapide)
- #51 Soupe de Légumes Express -> plats (ancienne catégorie : rapide)
- #52 Riz Frit aux Légumes -> plats (ancienne catégorie : rapide)
- #53 Burger Maison -> plats (ancienne catégorie : rapide)
- #54 Quesadillas au Fromage -> snacks (ancienne catégorie : rapide)
- #55 Salade de Quinoa -> plats (ancienne catégorie : rapide)
- #57 Lasagnes Végétariennes -> plats (ancienne catégorie : vegetarien)
- #58 Curry de Légumes -> plats (ancienne catégorie : vegetarien)
- #59 Falafels Maison -> snacks (ancienne catégorie : vegetarien)
- #60 Gratin de Chou-fleur -> plats (ancienne catégorie : vegetarien)

## Végétarien : gélatine animale (à trancher)
Détecté automatiquement d'après les ingrédients. Vérifie aussi les autres recettes marquées végétariennes.

- #10 Panna Cotta à la Vanille

## Ingrédients dont la quantité n'a pas été reconnue


- rien à signaler

## Images introuvables
Lance d'abord node tools/optimize-images.js.

- rien à signaler

## Quantités dans les étapes
Les quantités qui doivent suivre les portions sont entourées d'accolades, par exemple {500}g. Le site les recalculera.
- 426 quantités marquées. Vérifie quelques recettes dans data/recettes.json (cherche les accolades).

## Étapes avec une quantité non marquée (à vérifier)


- #3 Tarte aux Pommes
- #8 Profiteroles au Chocolat
- #13 Ratatouille Provençale
- #14 Bœuf Bourguignon
- #17 Pizza Margherita
- #22 Quiche Lorraine
- #35 Brioche Perdue
- #36 Thiébou Dieune
- #42 Alloco (Banane Plantin)
- #46 Salade César
- #53 Burger Maison
- #64 Jus Détox Vert
- #70 Jus d'Orange Carotte-Gingembre
- #72 Infusion Détox Citron-Gingembre
- #76 Bruschetta Tomate-Mozzarella
- #83 Brochettes de Poulet Satay

## Recettes presque identiques (à fusionner ou différencier)


- French Toast / Brioche Perdue (73 %)
- Maafe (Sauce d'Arachide) / Mafé de Poulet (76 %)
- Milkshake Chocolat-Noisette / Milkshake Fraise-Vanille (60 %)
