# Feuille de route — visualisations 3D de chimie

**Priorité de conception :** faire comprendre les phénomènes par des scènes 3D manipulables, lisibles et scientifiquement honnêtes. La scène est le cœur de chaque activité; le texte, les équations et les commandes servent à guider l’observation.

## Alignement avec le programme haïtien

Référence de travail : *Programme remanié de chimie du secondaire*, MENFP, version finale du 24 juillet 2024, annoncée pour la rentrée 2024. La progression ci-dessous suit le tableau annuel des pages 101–102 et les unités détaillées. Le document présente une divergence entre sa matrice de la page 39 et sa progression annuelle : faire confirmer l’ordre officiel au MENFP avant toute affirmation définitive pour une année scolaire donnée.

| Niveau / unité | Notions à apprendre | Visualisation 3D prioritaire |
|---|---|---|
| Secondaire I — A1 | Matière pure, mélanges, états, quantité de matière | Zoom continu de l’objet au matériau, particules de solide/liquide/gaz, mélange homogène et hétérogène; repères d’échelle explicites. |
| Secondaire I — A2 | Atome, ions, tableau périodique | Les 118 éléments identifiables, noyau et électrons comme modèle; numéro atomique, isotopes, ions, couches de valence et limites du modèle de Bohr. |
| Secondaire I — B1 | pH | Ions H₃O⁺ et OH⁻, comparaison acide/neutre/basique et dilution; compléter la scène par une échelle numérique, car le pH est logarithmique. |
| Secondaire I — D1 | Nomenclature et chaînes d’hydrocarbures | Méthane à chaînes plus longues, alcanes/alcènes/alcynes, géométrie, formule brute, liaisons simples/doubles/triples et rotation moléculaire. |
| Secondaire II — A3 | Liaisons, Lewis, géométrie, polarité | Partage/transfert d’électrons comme représentation, doublets, géométries moléculaires et dipôles; distinguer modèle de Lewis et distribution réelle de densité électronique. |
| Secondaire II — A4 | Équations et réarrangement chimique | Réactifs vers produits avec atomes conservés, liaisons qui se rompent/se forment, coefficients et bilan d’atomes manipulables. |
| Secondaire II — B2 | Acides/bases forts et faibles, concentration | Ionisation relative et dilution en particules; ne pas confondre force avec concentration. |
| Secondaire II — D2 | Groupes fonctionnels | Alcool, aldéhyde, acide carboxylique, ester et autres familles du cours, avec atomes et liaisons repérés. |
| Secondaire III MP — C1/C2 | Oxydoréduction et piles | États d’oxydation, transfert d’électrons, électrodes, circuit externe et migration ionique; distinguer le sens des électrons de celui du courant conventionnel. |
| Secondaire III SVT — B3/D3 | Sels/Lewis; structure, réactivité et synthèse organiques | Assemblage ionique ou donneur-accepteur, réactions organiques du programme, conditions expérimentales indiquées. |
| Secondaire IV MP — C3/C4 | Électrolyse et applications redox | Comparaison pile/électrolyse, sens des réactions et dépôts aux électrodes; montrer que la polarité dépend du dispositif. |
| Secondaire IV SVT — B4/D4 | Applications acide-base, biomolécules | Scènes de santé et de matière vivante : protéines, glucides, lipides, acides nucléiques, avec niveaux de zoom moléculaire. |
| Secondaire III/IV SES/LLA | Projets interdisciplinaires | Ressources et énergie, sport et muscles, climat, lumière/couleur, santé et médicaments : scènes contextuelles reliées aux concepts de chimie, sans les présenter comme unités obligatoires indépendantes. |

## Ordre de réalisation

### 1. Consolider les fondations — priorité immédiate

- Terminer la scène matière → matériau → molécules/atomes avec zoom manuel réellement continu, rotation libre sur tous les axes, sélection et identification des espèces.
- Harmoniser les 118 fiches d’éléments : identité, numéro atomique, masse/isotopes, électrons, couches et valence; préciser les limites pédagogiques des orbites dessinées.
- Ajouter les ions et les géométries moléculaires courantes avec légendes lisibles, tailles cohérentes et vues rapprochées.
- Contrôler les conventions pour l’eau, le verre et les mélanges : un verre courant est un réseau amorphe de silicates dont les modificateurs (Na, Ca, etc.) dépendent de la formulation; ils ne sont pas des atomes répétés à chaque motif moléculaire.

### 2. Développer la chimie organique — prochain lot

- Étendre les modèles vérifiés aux hydrocarbures du cours : séries linéaires et ramifiées pertinentes, cycles si exigés, isomères, insaturation et conformations.
- Ajouter groupes fonctionnels et biomolécules avec identification interactive des groupes et liaisons.
- Construire les réactions organiques étape par étape, en gardant les mêmes identifiants d’atomes d’un état à l’autre.

### 3. Réactions et conservation

- Prioriser combustion et équilibrage (A4), neutralisation et acidité (B1/B2), puis oxydoréduction et piles (C1/C2).
- Montrer les réactifs, étapes schématiques, produits, coefficients, nombre de chaque type d’atome et charge totale.
- Ajouter ensuite électrolyse, corrosion, synthèses et contextes applicatifs (C3/C4, SVT/SES/LLA).
- Ne jamais faire passer une interpolation graphique pour une simulation de dynamique moléculaire ou un mécanisme mesuré; annoter les simplifications et les conditions nécessaires.

## État du travail dans cette livraison

- Déjà présent dans l’application : laboratoire 3D de l’atome, scènes matière et zoom, molécules usuelles, équilibrage, pH, Lewis, redox/pile/électrolyse, corrosion, fonctions organiques et biomolécules. Ces scènes demandent une revue scientifique et visuelle avant d’être considérées comme complètes.
- Données structurales ajoutées : modèles idéalisés de méthane, éthane, propane, butane, pentane, éthène et éthyne dans `src/hydrocarbon3dData.js`.
- Données de réactions ajoutées : combustion du méthane, hydrogénation de l’éthène et échange redox fer/cuivre dans `src/reaction3dData.js`.
- Intégration commencée : scène de nomenclature utilisant maintenant les coordonnées moléculaires complètes; hydrogénation de l’éthène affichant deux états 3D avec identités atomiques conservées.
- À faire pour considérer le lot livré : validation visuelle dans le navigateur, revue d’accessibilité des commandes et légendes, et vérification scientifique niveau par niveau avec le MENFP/enseignants.

## Garde-fous scientifiques

- Les atomes ne sont pas de petites billes classiques suivant des orbites fixes; les trajectoires circulaires sont une simplification historique. Présenter les couches comme niveaux d’énergie et les orbitales comme régions de probabilité lorsqu’on avance.
- Les géométries et distances des hydrocarbures sont des conformations idéalisées en unités relatives, pas des mesures d’une molécule en mouvement.
- L’équation d’hydrogénation C₂H₄ + H₂ → C₂H₆ suppose un catalyseur et des conditions adaptées; l’interface doit le préciser.
- Le verre n’est pas une molécule unique : le verre sodocalcique est un réseau amorphe de silicates. Na et Ca modifient le réseau en proportions dépendant du type de verre.
- La corrosion produit un ensemble de composés et de phases; éviter de la dessiner comme une molécule unique appelée « rouille ».
- Pour une pile et une électrolyse, nommer oxydation/réduction aux électrodes; la polarité n’a pas la même interprétation dans les deux montages.

## Sources curriculaires

- MENFP, cadre curriculaire du secondaire : https://menfp.reseau-canope.fr/course/view.php?id=61
- MENFP, portail de diffusion du programme de chimie : https://digipad.app/p/1046516/369bed11920ea
- Copie consultable du programme de chimie (document complet) : https://docs.haitidocs.org/menfp-programme-secondaire-2024-chimie.pdf
- Catalogue/transcription consultable : https://www.haitidocs.org/doc/menfp-programme-secondaire-2024-chimie?lang=fr
