/**
 * Stepwise, framework-neutral data for curriculum-aligned 3D reaction scenes.
 *
 * Coordinates are illustrative molecular geometry, not computed trajectories.
 * Atoms keep the same `id` in every snapshot so an animator can interpolate
 * positions and show bonds forming/breaking without changing atom identity.
 */

const atom = (id, element, position, oxidationState = null) => ({
  id,
  element,
  position,
  ...(oxidationState == null ? {} : { oxidationState }),
});

const bond = (a, b, order = 1, type = 'covalente') => ({ a, b, order, type });

export const reaction3dData = [
  {
    id: 'methane-combustion',
    title: 'Combustion complète du méthane',
    curriculum: { unit: 'A4', grade: 'Secondaire II', status: 'tronc commun' },
    equation: 'CH₄ + 2 O₂ → CO₂ + 2 H₂O',
    equationCoefficients: { CH4: 1, O2: 2, CO2: 1, H2O: 2 },
    learningGoal: 'Suivre le réarrangement des atomes et vérifier leur conservation.',
    accuracyNote: 'Bilan global d’une combustion complète idéalisée; aucune trajectoire réactionnelle ni intermédiaire n’est calculé.',
    snapshots: [
      {
        id: 'reactants',
        label: 'Réactifs',
        atoms: [
          atom('c-methane', 'C', [0, 0, 0]),
          atom('h-m1', 'H', [0.63, 0.63, 0.63]), atom('h-m2', 'H', [-0.63, -0.63, 0.63]),
          atom('h-m3', 'H', [-0.63, 0.63, -0.63]), atom('h-m4', 'H', [0.63, -0.63, -0.63]),
          atom('o-a', 'O', [-2.1, 0, 0]), atom('o-b', 'O', [-3.22, 0, 0]),
          atom('o-c', 'O', [2.1, 0, 0]), atom('o-d', 'O', [3.22, 0, 0]),
        ],
        molecules: [
          { id: 'methane', formula: 'CH₄', atomIds: ['c-methane', 'h-m1', 'h-m2', 'h-m3', 'h-m4'] },
          { id: 'oxygen-a', formula: 'O₂', atomIds: ['o-a', 'o-b'] },
          { id: 'oxygen-b', formula: 'O₂', atomIds: ['o-c', 'o-d'] },
        ],
        bonds: [bond('c-methane', 'h-m1'), bond('c-methane', 'h-m2'), bond('c-methane', 'h-m3'), bond('c-methane', 'h-m4'), bond('o-a', 'o-b', 2), bond('o-c', 'o-d', 2)],
        associations: [],
        totalCharge: 0,
        atomCounts: { C: 1, H: 4, O: 4 },
      },
      {
        id: 'products',
        label: 'Produits',
        atoms: [
          atom('c-methane', 'C', [0, 0, 0]), atom('o-a', 'O', [-1.18, 0, 0]), atom('o-b', 'O', [1.18, 0, 0]),
          atom('o-c', 'O', [-3.1, 0, 0]), atom('h-m1', 'H', [-3.68, 0.81, 0]), atom('h-m2', 'H', [-3.68, -0.81, 0]),
          atom('o-d', 'O', [3.1, 0, 0]), atom('h-m3', 'H', [3.68, 0.81, 0]), atom('h-m4', 'H', [3.68, -0.81, 0]),
        ],
        molecules: [
          { id: 'carbon-dioxide', formula: 'CO₂', atomIds: ['c-methane', 'o-a', 'o-b'] },
          { id: 'water-a', formula: 'H₂O', atomIds: ['o-c', 'h-m1', 'h-m2'] },
          { id: 'water-b', formula: 'H₂O', atomIds: ['o-d', 'h-m3', 'h-m4'] },
        ],
        bonds: [bond('c-methane', 'o-a', 2), bond('c-methane', 'o-b', 2), bond('o-c', 'h-m1'), bond('o-c', 'h-m2'), bond('o-d', 'h-m3'), bond('o-d', 'h-m4')],
        associations: [],
        totalCharge: 0,
        atomCounts: { C: 1, H: 4, O: 4 },
      },
    ],
    balancing: { conservedAtoms: true, conservedCharge: true, note: '1 C, 4 H et 4 O de chaque côté; charge totale nulle.' },
  },
  {
    id: 'ethene-hydrogenation',
    title: 'Addition de dihydrogène à l’éthène',
    curriculum: { unit: 'D3', grade: 'Secondaire III · SVT', status: 'contenu spécialisé SVT' },
    equation: 'C₂H₄ + H₂ → C₂H₆',
    equationCoefficients: { C2H4: 1, H2: 1, C2H6: 1 },
    learningGoal: 'Voir la liaison double C=C devenir une liaison simple et deux liaisons C–H se former.',
    accuracyNote: 'Bilan stœchiométrique d’une hydrogénation; le modèle ne prétend pas représenter le catalyseur, les collisions ni le mécanisme moléculaire.',
    snapshots: [
      {
        id: 'reactants', label: 'Réactifs',
        atoms: [
          atom('c-left', 'C', [-0.67, 0, 0]), atom('c-right', 'C', [0.67, 0, 0]),
          atom('h-left-a', 'H', [-1.15, 0.91, 0]), atom('h-left-b', 'H', [-1.15, -0.91, 0]),
          atom('h-right-a', 'H', [1.15, 0.91, 0]), atom('h-right-b', 'H', [1.15, -0.91, 0]),
          atom('h-added-a', 'H', [2.2, 0.3, 0]), atom('h-added-b', 'H', [3.0, 0.3, 0]),
        ],
        molecules: [
          { id: 'ethene', formula: 'C₂H₄', atomIds: ['c-left', 'c-right', 'h-left-a', 'h-left-b', 'h-right-a', 'h-right-b'] },
          { id: 'hydrogen', formula: 'H₂', atomIds: ['h-added-a', 'h-added-b'] },
        ],
        bonds: [bond('c-left', 'c-right', 2), bond('c-left', 'h-left-a'), bond('c-left', 'h-left-b'), bond('c-right', 'h-right-a'), bond('c-right', 'h-right-b'), bond('h-added-a', 'h-added-b')],
        associations: [], totalCharge: 0, atomCounts: { C: 2, H: 6 },
      },
      {
        id: 'products', label: 'Produit',
        atoms: [
          atom('c-left', 'C', [-0.77, 0, 0]), atom('c-right', 'C', [0.77, 0, 0]),
          atom('h-left-a', 'H', [-1.18, 0.99, 0]), atom('h-left-b', 'H', [-1.18, -0.99, 0]),
          atom('h-right-a', 'H', [1.18, 0.99, 0]), atom('h-right-b', 'H', [1.18, -0.99, 0]),
          atom('h-added-a', 'H', [-0.77, 0, 1.08]), atom('h-added-b', 'H', [0.77, 0, -1.08]),
        ],
        molecules: [{ id: 'ethane', formula: 'C₂H₆', atomIds: ['c-left', 'c-right', 'h-left-a', 'h-left-b', 'h-right-a', 'h-right-b', 'h-added-a', 'h-added-b'] }],
        bonds: [bond('c-left', 'c-right'), bond('c-left', 'h-left-a'), bond('c-left', 'h-left-b'), bond('c-left', 'h-added-a'), bond('c-right', 'h-right-a'), bond('c-right', 'h-right-b'), bond('c-right', 'h-added-b')],
        associations: [], totalCharge: 0, atomCounts: { C: 2, H: 6 },
      },
    ],
    balancing: { conservedAtoms: true, conservedCharge: true, note: '2 C et 6 H de chaque côté; charge totale nulle.' },
  },
  {
    id: 'iron-copper-ion-redox',
    title: 'Transfert d’électrons entre le fer et Cu²⁺',
    curriculum: { unit: 'C1', grade: 'Secondaire III', status: 'tronc commun selon la progression annuelle' },
    equation: 'Fe + Cu²⁺ → Fe²⁺ + Cu',
    equationCoefficients: { Fe: 1, Cu2plus: 1, Fe2plus: 1, Cu: 1 },
    learningGoal: 'Identifier l’oxydation du fer, la réduction de Cu²⁺ et le transfert de deux électrons.',
    accuracyNote: 'Bilan ionique net simplifié en solution aqueuse. Les ions hydratés et les contre-ions spectateurs sont omis.',
    snapshots: [
      {
        id: 'reactants', label: 'Avant le transfert',
        atoms: [atom('iron', 'Fe', [-1.2, 0, 0], 0), atom('copper', 'Cu', [1.2, 0, 0], 2)],
        species: [
          { id: 'iron-atom', formula: 'Fe', atomIds: ['iron'], charge: 0, oxidationState: 0 },
          { id: 'copper-ion', formula: 'Cu²⁺', atomIds: ['copper'], charge: 2, oxidationState: 2 },
        ],
        molecules: [], bonds: [], associations: [], totalCharge: 2, atomCounts: { Fe: 1, Cu: 1 },
        electronTransfers: [{ id: 'e-transfer-1', fromAtomId: 'iron', toAtomId: 'copper' }, { id: 'e-transfer-2', fromAtomId: 'iron', toAtomId: 'copper' }],
      },
      {
        id: 'products', label: 'Après le transfert',
        atoms: [atom('iron', 'Fe', [-1.2, 0, 0], 2), atom('copper', 'Cu', [1.2, 0, 0], 0)],
        species: [
          { id: 'iron-ion', formula: 'Fe²⁺', atomIds: ['iron'], charge: 2, oxidationState: 2 },
          { id: 'copper-atom', formula: 'Cu', atomIds: ['copper'], charge: 0, oxidationState: 0 },
        ],
        molecules: [], bonds: [], associations: [], totalCharge: 2, atomCounts: { Fe: 1, Cu: 1 },
        electronTransfers: [{ id: 'e-transfer-1', fromAtomId: 'iron', toAtomId: 'copper' }, { id: 'e-transfer-2', fromAtomId: 'iron', toAtomId: 'copper' }],
      },
    ],
    bondingNote: 'Fe, Cu²⁺ et Fe²⁺ sont ici des espèces monoatomiques. Une interaction électrostatique entre ions, si elle est montrée dans un autre contexte, n’est pas une liaison covalente; cette scène ne dessine donc aucun lien entre les espèces.',
    balancing: { conservedAtoms: true, conservedCharge: true, note: '1 Fe et 1 Cu de chaque côté; charge totale +2 de chaque côté. Fe perd 2 e⁻ et Cu²⁺ gagne 2 e⁻.' },
  },
];

export const reaction3dIntegrationNotes = {
  schema: 'Chaque snapshot contient atoms[{id,element,position,oxidationState?}], molecules/species, bonds, associations, totalCharge et atomCounts.',
  animation: 'Faire correspondre les atomes par id entre snapshots; interpoler position et opacité des liaisons. Ne pas interpréter les deux instantanés comme un mécanisme ou une simulation de dynamique moléculaire.',
  bonds: 'bond.type=covalente représente un partage électronique et bond.order son ordre schématique. associations est réservé aux voisinages/interactions non covalents; aucune association ne doit être rendue comme une liaison.',
  electronTransfer: 'Dans la réaction redox, electronTransfers matérialise le bilan de transfert sans ajouter des électrons libres au compte atomique ou à la charge des snapshots; les charges/états d’oxydation des espèces portent le bilan.',
  validation: 'Les trois réactions conservent explicitement chaque élément et la charge totale dans chaque snapshot; vérifier atomCounts et totalCharge avant toute animation ou extension.',
  scope: 'Jeu de données de départ aligné sur A4, D3 et C1 du programme présent dans curriculum.js. Géométries, tailles et temps d’animation restent des choix de visualisation pédagogique.',
};

