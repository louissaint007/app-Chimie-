# Atòm — laboratoire de chimie

Application éducative web autonome pour explorer les notions de chimie du secondaire haïtien au moyen de modèles et de manipulations virtuelles. Interface initiale en français, avec unités structurées pour faciliter une traduction en kreyòl. Aucun compte ni serveur de données n'est requis.

## Lancer l'application

Depuis ce dossier, utiliser une installation Node.js compatible avec Vite :

```powershell
npm install
npm run dev
```

Vite affiche l'adresse locale à ouvrir. Pour produire une version compilée : `npm run build`.

## Progression de chimie retenue

Le repère de classe affiché par l'application suit le tableau **« Répartition annuelle des unités d'apprentissage » (p. 101–102)** et les en-têtes des unités détaillées du programme remanié 2024. Cette répartition n'est pas parfaitement cohérente avec la matrice de compétences de la p. 39 :

| Année | Tableau annuel p. 101–102 et unités détaillées | Série MP | Série SVT |
|---|---|---|---|
| Secondaire I | A1, A2, B1, D1 | Les quatre unités communes | Les quatre unités communes |
| Secondaire II | A3, A4, B2, D2 | Les quatre unités communes | Les quatre unités communes |
| Secondaire III | C1, C2; contenus grisés : B3, D3 | C1, C2 | C1, C2, B3, D3 |
| Secondaire IV | C3, C4; contenus grisés : B4, D4 | C3, C4 | C3, C4, B4, D4 |

La p. 101 précise que les lignes grisées concernent SVT seulement. Elle indique 2 h/semaine en SVT et 1 h/semaine en MP au Secondaire III, puis 3 h/semaine en SVT et 1 h/semaine en MP au Secondaire IV.

**Divergence à faire vérifier par le MENFP ou l'équipe pédagogique :** la matrice de la p. 39 classe A1, A2, A3 et B1 en Secondaire I; B2, C1, D1 et D2 en Secondaire II; A4, B3, C2 et D3 en Secondaire III; C3, C4, B4 et D4 en Secondaire IV. Cette matrice contredit les en-têtes détaillés d'au moins A3, A4, B1, C1 et D1 et le tableau annuel. L'application ne résout pas cette contradiction par supposition : les niveaux affichés sont explicitement des **recommandations selon le tableau annuel et les fiches détaillées**, et cette note garde l'écart visible.

Les séries **SES** et **LLA** ne reçoivent pas ici la progression spécialisée SVT/MP. Le programme 2024 décrit pour elles des unités communes interdisciplinaires avec physique, biologie et géologie aux Secondaire III et IV, et laisse aux équipes enseignantes le choix des compétences visées dans ces projets.

## Sources du programme

1. **MENFP, Programme remanié de l'enseignement secondaire : Chimie**, version définitive datée du 24 juillet 2024, 104 p. Le préambule du ministre autorise l'utilisation des programmes remaniés à la rentrée 2024. La référence originale citée par le document est le dépôt MENFP *Les programmes remaniés du secondaire* : [Digipad MENFP](https://digipad.app/p/1046516/369bed11920ea). Le dépôt demande JavaScript et sa disponibilité directe peut varier. Copie consultable/téléchargeable contenant le PDF intégral : [PDF du programme de chimie 2024](https://docs.haitidocs.org/menfp-programme-secondaire-2024-chimie.pdf) ; notice bibliographique et transcription : [HaitiDocs — Chimie 2024](https://www.haitidocs.org/doc/menfp-programme-secondaire-2024-chimie?lang=fr). Pages consultées : p. 5–6 (organisation en tronc commun puis séries), p. 37–40 (thèmes, parcours SES/LLA et matrice), p. 40–100 (unités détaillées), p. 101–103 (progression annuelle et repères).
2. **MENFP, Cadre d'orientation curriculaire pour le système éducatif haïtien 2024–2054**, cadre de référence pour la réforme : [source MENFP / Réseau Canopé](https://menfp.reseau-canope.fr/course/view.php?id=61) ; [notice et document consultable](https://www.haitidocs.org/doc/menfp-2024-cadre-orientation-curriculaire?lang=fr).
3. **MENFP, Programme à compétences minimales de chimie, Secondaire I et II**, décembre 2019 : [Secondaire I](https://www.haitidocs.org/doc/menfp-programme-secondaire-ns1-chimie) ; [Secondaire II](https://www.haitidocs.org/doc/menfp-programme-secondaire-ns2-chimie). Ces documents sont explicitement liés à l'année scolaire raccourcie 2019–2020 après le *Peyi lock*; ils ne doivent pas remplacer le programme remanié 2024.
4. **MENFP, Programme-cadre de chimie**, copie numérisée : [recueil des programmes-cadres](https://www.haiti-now.org/wp-content/uploads/2021/04/Programme-Cadre-de-toutes-les-Matieres.pdf), section chimie autour des p. 78–85 du PDF. C'est une ancienne organisation par thèmes/séries; elle n'est pas fusionnée avec la progression annuelle 2024 dans les données de l'application.

La version 2024 est le document disciplinaire de chimie le plus récent identifié pendant cette vérification. Le dépôt original la rend consultable, et la copie intégrale permet de comparer ses tableaux. Une conférence de presse MENFP du 23 décembre 2024, rapportée par *Le Nouvelliste*, a annoncé des modifications au programme du secondaire, mais l'article consultable ne précise pas si elles touchent la chimie : [compte rendu du 27 décembre 2024](https://lenouvelliste.com/article/252176/le-menfp-presente-un-programme-revisite-pour-lenseignement-secondaire). **Le statut de la progression de chimie après juillet 2024 reste donc à confirmer** : avant un usage institutionnel comme progression réglementaire en 2026, demander au MENFP si une version révisée, circulaire ou correction de la matrice p. 39 a été publiée.

## Principes pédagogiques et limites

- Chaque unité suit une question concrète, une explication, un modèle manipulable et une vérification avec retour raisonné.
- L'unité sur l'atome commence par un zoom 3D manuel: fais glisser pour choisir l'angle, puis utilise la molette ou le pincement pour avancer librement entre les échelles. Le modèle dissout progressivement le verre et le liquide pour révéler leurs constituants. Vue du dessus, le zoom expose un échantillon de molécules d'eau H₂O puis leurs atomes H et O; de côté ou dessous, il révèle un réseau schématique du verre soda-calcique (Si/O, Na/Ca). Le verre réel est un solide amorphe dont la composition varie, pas un assemblage de molécules isolées.
- La fiche d'un élément distingue numéro atomique Z (protons, identité), nombre de masse A (protons + neutrons pour un isotope), électrons de la couche externe et valence (capacité de combinaison usuelle). Les valences usuelles des groupes principaux sont des repères simplifiés; les métaux de transition et certains éléments ont des comportements variables.
- Z provient du comptage des protons et classe les éléments; les électrons de valence sont lus sur la couche externe de la configuration électronique. La valence chimique est un modèle de capacité de combinaison, interprété à partir des liaisons et des électrons partagés, gagnés ou perdus; elle n'est pas un résultat universel d'une simple opération.
- Les exemples haïtiens (eau, cuisine, agriculture, corrosion, piles, matériaux) n'impliquent pas que le pH seul atteste la potabilité de l'eau ou dicte une pratique agricole.
- Les activités sont des simulations conceptuelles. Elles ne donnent pas de protocole pour reproduire une réaction à la maison. Toute expérimentation réelle évoquée relève d'un laboratoire supervisé et de règles de sécurité.
- **Les scènes scientifiques de chaque unité sont rendues en 3D WebGL** : atomes et ions, molécules et liaisons, états de la matière, pH, équations-bilans, redox et applications. Fais glisser la scène pour orbiter, utilise la molette ou le pincement pour zoomer, et les commandes pour faire tourner ou recentrer le modèle.
- Les structures, couleurs, tailles et distances sont des conventions visuelles agrandies. Le modèle atomique montre des pistes circulaires de Bohr et plusieurs électrons peuvent partager un même niveau d'énergie. Ces trajectoires sont un schéma historique et pédagogique : les électrons réels se décrivent par des orbitales, régions de probabilité. Ces scènes ne calculent pas la dynamique moléculaire ou quantique.
- Les contenus hors progression ou approfondissements éventuels doivent porter la mention « Pour aller plus loin »; cette première version ne présente pas de chapitre hors liste comme exigence du programme.

## Architecture

- `src/curriculum.js` rassemble les unités, recommandations, notions et réponses attendues.
- `src/main.jsx` contient la navigation, les parcours et les leçons.
- `src/ChemistryScene3D.jsx` construit les scènes Three.js; `src/ChemistryLearningLab.jsx` relie leurs interactions aux unités.
- `src/scene3d.css` et `src/app.css` contiennent le système visuel responsive.

## Tableau périodique 3D

L'unité A2 permet de sélectionner et rechercher les 118 éléments. Le noyau représente chaque proton et neutron par une particule instanciée; les électrons suivent les configurations électroniques et se déplacent sur des couches schématiques. Les flèches identifient les parties du modèle. Le nombre de neutrons est une estimation calculée depuis un nombre de masse de référence arrondi et ne désigne pas toujours un isotope précis. Les configurations des éléments au-delà de Z = 103 sont prédites.

Les numéros atomiques, masses et propriétés élémentaires s'appuient sur le [tableau périodique du NIST](https://www.nist.gov/pml/periodic-table-elements). Les configurations électroniques et la structure des données proviennent de [Bowserinator/Periodic-Table-JSON](https://github.com/Bowserinator/Periodic-Table-JSON), sous licence CC BY-SA 3.0. Les particules et distances sont agrandies; les pistes circulaires restent une simplification et ne montrent pas la forme exacte des orbitales.

Le zoom de l'eau sert à établir une progression de l'objet visible aux constituants microscopiques. Les molécules présentées en petit groupe sont un échantillon de démonstration, pas un comptage de toutes les particules dans le verre.

Les autres applications du miroir sont des projets voisins et ne sont pas modifiées par cette application.
