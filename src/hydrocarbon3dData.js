// Educational ball-and-stick geometries in Angstrom-like relative units.
// Bond lengths are approximate standard gas-phase values; structures are idealized,
// not experimental conformers. Curriculum links: D1 alkane naming and D3 addition to ethene.

const add = (a, b) => a.map((value, i) => value + b[i]);
const sub = (a, b) => a.map((value, i) => value - b[i]);
const mul = (a, scalar) => a.map((value) => value * scalar);
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (v) => mul(v, 1 / Math.hypot(...v));
const perpendicular = (v) => unit(cross(v, Math.abs(v[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0]));

function makeAtomsAndBonds(carbonPositions, chainBonds, hybridization = 'sp³') {
  const atoms = carbonPositions.map((position, index) => ({ id: `C${index + 1}`, symbol: 'C', position, hybridization }));
  const bonds = chainBonds.map(([from, to]) => ({ from: `C${from + 1}`, to: `C${to + 1}`, order: 1 }));
  const neighbors = carbonPositions.map(() => []);
  chainBonds.forEach(([a, b]) => { neighbors[a].push(b); neighbors[b].push(a); });

  carbonPositions.forEach((position, carbonIndex) => {
    const attached = neighbors[carbonIndex].map((neighborIndex) => unit(sub(carbonPositions[neighborIndex], position)));
    let hydrogenDirections;
    if (attached.length === 0) {
      // Methane: tetrahedral directions with the ideal 109.5 degree angle.
      hydrogenDirections = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(unit);
    } else if (attached.length === 1) {
      const axis = mul(attached[0], -1);
      const u = perpendicular(axis);
      const v = unit(cross(axis, u));
      hydrogenDirections = [0, 1, 2].map((i) => add(mul(axis, -1 / 3), mul(add(mul(u, Math.cos(i * 2 * Math.PI / 3)), mul(v, Math.sin(i * 2 * Math.PI / 3))), Math.sqrt(8 / 9))));
    } else {
      // Two remaining tetrahedral directions at an internal sp3 carbon.
      const axis = unit(add(attached[0], attached[1]));
      const side = perpendicular(axis);
      hydrogenDirections = [add(mul(axis, -1 / Math.sqrt(3)), mul(side, Math.sqrt(2 / 3))), add(mul(axis, -1 / Math.sqrt(3)), mul(side, -Math.sqrt(2 / 3)))];
    }
    hydrogenDirections.forEach((direction, hydrogenIndex) => {
      const id = `H${atoms.filter((atom) => atom.symbol === 'H').length + 1}`;
      // C-H is ~1.09 Å; the model uses 1.09 relative units.
      atoms.push({ id, symbol: 'H', position: add(position, mul(direction, 1.09)), hybridization: null });
      bonds.push({ from: `C${carbonIndex + 1}`, to: id, order: 1 });
    });
  });
  return { atoms, bonds };
}

function alkaneData(carbonCount, name) {
  if (carbonCount === 1) {
    const { atoms, bonds } = makeAtomsAndBonds([[0, 0, 0]], []);
    return { id: 'methane', name, formula: 'CH4', geometry: 'tétraédrique autour du carbone', geometryNote: 'Carbone sp³; angles H–C–H idéalisés à 109,5°.', atoms, bonds };
  }
  const step = 1.54;
  const halfTurn = 70.5 * Math.PI / 360;
  const positions = [[0, 0, 0]];
  for (let index = 1; index < carbonCount; index += 1) {
    const directionAngle = index % 2 === 1 ? halfTurn : -halfTurn;
    positions.push(add(positions[index - 1], [step * Math.cos(directionAngle), step * Math.sin(directionAngle), 0]));
  }
  const chainBonds = Array.from({ length: carbonCount - 1 }, (_, index) => [index, index + 1]);
  const { atoms, bonds } = makeAtomsAndBonds(positions, chainBonds);
  const formula = `C${carbonCount}H${2 * carbonCount + 2}`;
  const geometryNote = 'Chaque carbone est sp³, avec une géométrie tétraédrique approximative; la chaîne est représentée en conformation zigzag.';
  return { id: name.toLowerCase(), name, formula, geometry: 'chaîne ouverte en zigzag', geometryNote, atoms, bonds };
}

function alkeneEthene() {
  const atoms = [
    { id: 'C1', symbol: 'C', position: [-0.67, 0, 0], hybridization: 'sp²' },
    { id: 'C2', symbol: 'C', position: [0.67, 0, 0], hybridization: 'sp²' },
    { id: 'H1', symbol: 'H', position: [-1.215, 0.944, 0], hybridization: null },
    { id: 'H2', symbol: 'H', position: [-1.215, -0.944, 0], hybridization: null },
    { id: 'H3', symbol: 'H', position: [1.215, 0.944, 0], hybridization: null },
    { id: 'H4', symbol: 'H', position: [1.215, -0.944, 0], hybridization: null },
  ];
  const bonds = [{ from: 'C1', to: 'C2', order: 2 }, ...[['C1','H1'],['C1','H2'],['C2','H3'],['C2','H4']].map(([from,to]) => ({ from, to, order: 1 }))];
  return { id: 'ethene', name: 'Éthène', formula: 'C2H4', geometry: 'plane; trigonal plane autour de chaque carbone', geometryNote: 'Chaque carbone est sp²; angles proches de 120°. La liaison C=C est double.', atoms, bonds };
}

function alkyneEthyne() {
  const atoms = [
    { id: 'C1', symbol: 'C', position: [-0.60, 0, 0], hybridization: 'sp' },
    { id: 'C2', symbol: 'C', position: [0.60, 0, 0], hybridization: 'sp' },
    { id: 'H1', symbol: 'H', position: [-1.66, 0, 0], hybridization: null },
    { id: 'H2', symbol: 'H', position: [1.66, 0, 0], hybridization: null },
  ];
  const bonds = [{ from: 'C1', to: 'C2', order: 3 }, { from: 'C1', to: 'H1', order: 1 }, { from: 'C2', to: 'H2', order: 1 }];
  return { id: 'ethyne', name: 'Éthyne', formula: 'C2H2', geometry: 'linéaire', geometryNote: 'Chaque carbone est sp; les quatre atomes sont alignés et l’angle est de 180°. La liaison C≡C est triple.', atoms, bonds };
}

export const hydrocarbon3dMolecules = [
  alkaneData(1, 'Méthane'),
  alkaneData(2, 'Éthane'),
  alkaneData(3, 'Propane'),
  alkaneData(4, 'Butane'),
  alkaneData(5, 'Pentane'),
  alkaneData(6, 'Hexane'),
  alkaneData(7, 'Heptane'),
  alkaneData(8, 'Octane'),
  alkaneData(9, 'Nonane'),
  alkaneData(10, 'Décane'),
  alkaneData(11, 'Undécane'),
  alkaneData(12, 'Dodécane'),
  alkeneEthene(),
  alkyneEthyne(),
];

export const hydrocarbon3dById = Object.fromEntries(hydrocarbon3dMolecules.map((molecule) => [molecule.id, molecule]));
